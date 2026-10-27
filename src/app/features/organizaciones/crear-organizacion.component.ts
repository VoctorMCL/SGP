import { Component, AfterViewInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CasillaService } from '../../core/services/casilla.service';

@Component({
  selector: 'app-crear-organizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <a routerLink="/organizaciones" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Volver a Mis Organizaciones
      </a>

      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Crear Nueva Organización</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
          Configura los detalles maestros de tu red de estacionamientos. Selecciona la ubicación en el mapa interactivo y define capacidades.
        </p>
      </div>

      @if (errorMensaje()) {
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMensaje() }}</span>
        </div>
      }

      <form [formGroup]="orgForm" (ngSubmit)="crear()" class="space-y-6">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            1. Identidad y Ubicación (OpenStreetMap)
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Organización</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="Ej. Parqueadero MetroMall S.A."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">NIT / Identificación Fiscal</label>
              <input
                type="text"
                formControlName="nit"
                placeholder="900123456-7"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Entidad</label>
              <select
                formControlName="tipoEntidad"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Mixto">Mixto</option>
                <option value="Publico">Público</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300">
                  Ubicación y Dirección (Selecciona en el mapa OpenStreetMap)
                </label>
                <button
                  type="button"
                  (click)="usarMiUbicacion()"
                  class="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v3m0 14v3m10-10h-3M5 12H2"></path>
                  </svg>
                  Usar mi ubicación GPS
                </button>
              </div>

              <div class="relative rounded-2xl overflow-hidden border border-slate-800 mb-3 shadow-lg">
                <div id="mapa-osm" class="w-full h-72 bg-slate-950 z-0"></div>
                <div class="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 shadow flex items-center gap-2">
                  <span>📍 Haz clic en el mapa para fijar el estacionamiento</span>
                </div>
              </div>

              <input
                type="text"
                formControlName="direccion"
                placeholder="Dirección detectada o manual (Ej. Calle 10 # 45-20, Itagüí)"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Descripción Corta</label>
              <textarea
                rows="2"
                formControlName="descripcion"
                placeholder="Breve descripción de la sede y accesos disponibles..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            2. Capacidad y Operación
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Total de Puestos Iniciales</label>
              <input
                type="number"
                min="1"
                formControlName="totalPuestos"
                placeholder="24"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Límite de Miembros</label>
              <input
                type="number"
                min="1"
                formControlName="limiteMiembros"
                placeholder="100"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Zona Horaria</label>
              <input
                type="text"
                formControlName="zonaHoraria"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="reservasPublicas" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Reservas Públicas</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="cobroAutomatico" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Cobro Automático</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="cobroPorHora" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Cobro por Hora</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="acceso24_7" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Acceso 24/7</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-4">
          <a routerLink="/organizaciones" class="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold">
            Cancelar
          </a>
          <button
            type="submit"
            [disabled]="cargando()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            @if (cargando()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Guardando...</span>
            } @else {
              <span>Crear y Abrir Diseñador de Parqueo →</span>
            }
          </button>
        </div>
      </form>
    </main>
  `
})
export class CrearOrganizacionComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private organizacionService = inject(OrganizacionService);
  private casillaService = inject(CasillaService);
  private router = inject(Router);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  orgForm = this.fb.group({
    nombre: ['', [Validators.required]],
    nit: ['', [Validators.required]],
    tipoEntidad: ['Residencial', [Validators.required]],
    direccion: ['', [Validators.required]],
    descripcion: [''],
    totalPuestos: [24, [Validators.required, Validators.min(1)]],
    limiteMiembros: [100, [Validators.required, Validators.min(1)]],
    zonaHoraria: ['America/Bogota', [Validators.required]],
    reservasPublicas: [true],
    cobroAutomatico: [false],
    cobroPorHora: [false],
    acceso24_7: [true]
  });

  ngAfterViewInit(): void {
    this.iniciarMapaOSM();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private iniciarMapaOSM(): void {
    const latDefault = 6.172;
    const lngDefault = -75.609;

    this.map = L.map('mapa-osm', {
      zoomControl: true,
      attributionControl: true
    }).setView([latDefault, lngDefault], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.marker = L.marker([latDefault, lngDefault], { icon: pinIcon, draggable: true }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
        this.geocodificarInverso(e.latlng.lat, e.latlng.lng);
      }
    });

    this.marker.on('dragend', () => {
      if (this.marker) {
        const pos = this.marker.getLatLng();
        this.geocodificarInverso(pos.lat, pos.lng);
      }
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  usarMiUbicacion(): void {
    if (navigator.geolocation && this.map && this.marker) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.map?.setView([lat, lng], 16);
          this.marker?.setLatLng([lat, lng]);
          this.geocodificarInverso(lat, lng);
        },
        (err) => {
          console.warn('No se pudo obtener la geolocalización:', err);
        }
      );
    }
  }

  private geocodificarInverso(lat: number, lng: number): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.orgForm.patchValue({ direccion: data.display_name });
        }
      })
      .catch(() => {});
  }

  crear(): void {
    if (this.orgForm.invalid) {
      this.errorMensaje.set('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const val = this.orgForm.value as any;

    this.organizacionService.crearOrganizacion(val).subscribe({
      next: (res) => {
        const orgId = res.organizacion._id;
        // Redirigir directamente al Diseñador Interactivo de Mapa del Parqueadero
        this.cargando.set(false);
        this.router.navigate(['/organizaciones', orgId, 'disenador']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al crear la organización.');
      }
    });
  }
}
