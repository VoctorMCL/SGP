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

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <a routerLink="/organizaciones" class="group inline-flex items-center gap-2 text-[0.7rem] font-medium text-mist transition-colors hover:text-chalk">
        <svg class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m5 5-5-5 5-5"></path>
        </svg>
        Volver a mis sedes
      </a>

      <!-- Encabezado -->
      <div class="mt-7 flex flex-col gap-6 border-b border-edge pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="rise">
          <span class="kicker">Nueva sede / Configuración</span>
          <h1 class="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-chalk sm:text-5xl">
            Diseña tu<br /><span class="text-outline">parqueadero.</span>
          </h1>
          <p class="mt-4 max-w-lg text-[0.8rem] leading-relaxed text-mist">
            Define la identidad y ubicación de la sede. Al finalizar abrirás el editor visual para dibujar casillas, entradas y salidas.
          </p>
        </div>

        <!-- Pasos -->
        <div class="rise-2 flex items-center gap-1.5 text-[0.6rem]">
          <span class="flex items-center gap-2 rounded-md border border-signal/25 bg-signal/[0.06] px-2.5 py-2 text-signal">
            <span class="mono">01</span> Identidad
          </span>
          <span class="h-px w-4 bg-edge-strong"></span>
          <span class="flex items-center gap-2 rounded-md border border-edge px-2.5 py-2 text-mist">
            <span class="mono">02</span> Operación
          </span>
          <span class="h-px w-4 bg-edge-strong"></span>
          <span class="flex items-center gap-2 rounded-md border border-edge px-2.5 py-2 text-mist/60">
            <span class="mono">03</span> Plano
          </span>
        </div>
      </div>

      @if (errorMensaje()) {
        <div class="mt-5 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/[0.07] p-3.5 text-[0.72rem] text-danger">
          <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke-width="1.8"></circle>
            <path stroke-linecap="round" stroke-width="1.8" d="M12 8v4m0 3.5v.01"></path>
          </svg>
          <span>{{ errorMensaje() }}</span>
        </div>
      }

      <form [formGroup]="orgForm" (ngSubmit)="crear()" class="mt-6 grid items-start gap-5 lg:grid-cols-12">
        <!-- Columna principal -->
        <div class="space-y-5 lg:col-span-8">
          <!-- Identidad -->
          <section class="panel rise-2">
            <div class="flex items-center justify-between border-b border-edge px-6 py-4">
              <div class="section-head mb-0">
                <span class="section-num">01</span>
                <span class="section-title">Identidad de la sede</span>
              </div>
              <span class="mono hidden text-[0.52rem] uppercase tracking-[0.16em] text-mist sm:inline">Datos maestros</span>
            </div>

            <div class="grid gap-4 p-6 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="label" for="nombre">Nombre de la organización</label>
                <input id="nombre" type="text" formControlName="nombre" placeholder="Ej. Parqueadero MetroMall S.A." class="field" />
              </div>

              <div>
                <label class="label" for="nit">NIT / Identificación fiscal</label>
                <input id="nit" type="text" formControlName="nit" placeholder="900123456-7" class="field field-mono" />
              </div>

              <div>
                <label class="label" for="tipoEntidad">Tipo de entidad</label>
                <select id="tipoEntidad" formControlName="tipoEntidad" class="field">
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Mixto">Mixto</option>
                  <option value="Publico">Público</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <div class="mb-1.5 flex items-end justify-between">
                  <label class="label mb-0" for="direccion">Ubicación y dirección</label>
                  <button
                    type="button"
                    (click)="usarMiUbicacion()"
                    class="mono inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.12em] text-flow transition-colors hover:text-chalk"
                  >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" stroke-width="1.8"></circle>
                      <path stroke-linecap="round" stroke-width="1.8" d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
                    </svg>
                    Usar mi ubicación
                  </button>
                </div>

                <div class="relative overflow-hidden rounded-lg border border-edge bg-[#070a10]">
                  <div id="mapa-osm" class="map-dark z-0 h-[19rem] w-full"></div>
                  <div class="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded border border-edge/80 bg-void/85 px-2.5 py-1.5 text-[0.6rem] text-mist backdrop-blur">
                    <span class="h-1.5 w-1.5 rounded-full bg-signal"></span>
                    Haz clic en el mapa para fijar la sede
                  </div>
                  <div class="pointer-events-none absolute bottom-3 right-3 z-[500] rounded border border-edge/80 bg-void/85 px-2 py-1 backdrop-blur">
                    <span class="mono text-[0.5rem] uppercase tracking-[0.14em] text-mist/70">OpenStreetMap</span>
                  </div>
                  <span class="pointer-events-none absolute left-2 top-2 z-[500] h-4 w-4 border-l border-t border-signal/60"></span>
                  <span class="pointer-events-none absolute bottom-2 left-2 z-[500] h-4 w-4 border-b border-l border-signal/60"></span>
                  <span class="pointer-events-none absolute bottom-2 right-2 z-[500] h-4 w-4 border-b border-r border-signal/60"></span>
                </div>

                <input
                  id="direccion"
                  type="text"
                  formControlName="direccion"
                  placeholder="Dirección detectada o manual (Ej. Calle 10 # 45-20, Itagüí)"
                  class="field mt-3"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="label" for="descripcion">Descripción corta</label>
                <textarea
                  id="descripcion"
                  rows="2"
                  formControlName="descripcion"
                  placeholder="Breve descripción de la sede y accesos disponibles…"
                  class="field"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Operación -->
          <section class="panel rise-3">
            <div class="flex items-center justify-between border-b border-edge px-6 py-4">
              <div class="section-head mb-0">
                <span class="section-num">02</span>
                <span class="section-title">Capacidad y operación</span>
              </div>
              <span class="mono hidden text-[0.52rem] uppercase tracking-[0.16em] text-mist sm:inline">Reglas del sitio</span>
            </div>

            <div class="p-6">
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <label class="label" for="totalPuestos">Puestos iniciales</label>
                  <input id="totalPuestos" type="number" min="1" formControlName="totalPuestos" placeholder="24" class="field field-mono" />
                </div>
                <div>
                  <label class="label" for="limiteMiembros">Límite de miembros</label>
                  <input id="limiteMiembros" type="number" min="1" formControlName="limiteMiembros" placeholder="100" class="field field-mono" />
                </div>
                <div>
                  <label class="label" for="zonaHoraria">Zona horaria</label>
                  <input id="zonaHoraria" type="text" formControlName="zonaHoraria" class="field field-mono" />
                </div>
              </div>

              <div class="mt-5 border-t border-edge pt-5">
                <span class="label">Módulos habilitados</span>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label class="checkbox-tile">
                    <input type="checkbox" formControlName="reservasPublicas" />
                    <span>
                      <span class="block text-[0.7rem] font-medium text-chalk">Reservas públicas</span>
                      <span class="block text-[0.58rem] text-mist">Cualquier miembro puede reservar</span>
                    </span>
                  </label>

                  <label class="checkbox-tile">
                    <input type="checkbox" formControlName="cobroAutomatico" />
                    <span>
                      <span class="block text-[0.7rem] font-medium text-chalk">Cobro automático</span>
                      <span class="block text-[0.58rem] text-mist">Liquidación al finalizar</span>
                    </span>
                  </label>

                  <label class="checkbox-tile">
                    <input type="checkbox" formControlName="cobroPorHora" />
                    <span>
                      <span class="block text-[0.7rem] font-medium text-chalk">Cobro por hora</span>
                      <span class="block text-[0.58rem] text-mist">Tarifa variable por tiempo</span>
                    </span>
                  </label>

                  <label class="checkbox-tile">
                    <input type="checkbox" formControlName="acceso24_7" />
                    <span>
                      <span class="block text-[0.7rem] font-medium text-chalk">Acceso 24/7</span>
                      <span class="block text-[0.58rem] text-mist">Sin restricción horaria</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Columna lateral -->
        <aside class="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <div class="panel notch-tr rise-3 overflow-hidden">
            <div class="relative h-28 overflow-hidden border-b border-edge bg-[#070a10]">
              <div class="absolute inset-0 line-grid opacity-50"></div>
              <div class="absolute inset-0 bg-gradient-to-br from-signal/[0.09] via-transparent to-flow/[0.1]"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="mono text-[0.55rem] uppercase tracking-[0.24em] text-signal/80">SGP / Setup</div>
              </div>
              <div class="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div class="flex gap-1">
                  @for (b of miniauras; track $index) {
                    <span class="h-5 w-1 rounded-sm" [class]="b % 5 === 0 ? 'bg-danger/50' : 'bg-ok/40'"></span>
                  }
                </div>
                <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/60">Nivel 01</span>
              </div>
            </div>

            <div class="p-5">
              <h2 class="text-sm font-semibold text-chalk">Resumen de creación</h2>
              <p class="mt-1 text-[0.68rem] leading-relaxed text-mist">
                La sede se crea vacía. A continuación dibujarás el plano con el editor interactivo.
              </p>

              <dl class="mt-4 space-y-2.5 border-t border-edge pt-4 text-[0.68rem]">
                <div class="flex items-center justify-between gap-2">
                  <dt class="text-mist">Nombre</dt>
                  <dd class="max-w-[10rem] truncate text-right font-medium text-chalk">{{ orgForm.value.nombre || 'Sin definir' }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-mist">Entidad</dt>
                  <dd class="font-medium text-chalk">{{ orgForm.value.tipoEntidad }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-mist">Puestos</dt>
                  <dd class="mono font-medium text-signal">{{ orgForm.value.totalPuestos }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-mist">Zona horaria</dt>
                  <dd class="mono font-medium text-chalk">{{ orgForm.value.zonaHoraria }}</dd>
                </div>
              </dl>

              <button
                type="submit"
                [disabled]="cargando()"
                class="btn btn-signal mt-5 h-11 w-full"
              >
                @if (cargando()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                  <span>Creando sede…</span>
                } @else {
                  <span>Crear y abrir editor</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                  </svg>
                }
              </button>
              <a routerLink="/organizaciones" class="mt-2 flex w-full items-center justify-center py-2 text-[0.65rem] font-medium text-mist transition-colors hover:text-chalk">
                Cancelar
              </a>
            </div>
          </div>

          <div class="panel-flat flex items-start gap-2.5 p-4">
            <span class="mt-0.5 text-signal">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <p class="text-[0.65rem] leading-relaxed text-mist">
              Solo el creador de la organización podrá editar el plano y los puestos. Los miembros acceden al mapa en modo lectura con reservas.
            </p>
          </div>
        </aside>
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
  miniauras = Array.from({ length: 12 }, (_, i) => i);

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
      zoomControl: false,
      attributionControl: false
    }).setView([latDefault, lngDefault], 14);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="position:relative;width:34px;height:34px;display:grid;place-items:center;background:#cbd5e1;color:#080b0f;border-radius:8px 8px 8px 2px;box-shadow:0 0 0 4px rgba(203,213,225,.25),0 14px 24px -8px rgba(0,0,0,.9);transform:rotate(-45deg)">
        <span style="transform:rotate(45deg);font:700 13px/1 'JetBrains Mono',monospace">P</span>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 32]
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
