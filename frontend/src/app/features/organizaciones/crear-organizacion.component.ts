import { Component, AfterViewInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import tzlookup from 'tz-lookup';
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
        <div class="rise-2 flex flex-wrap items-center gap-1.5 text-[0.6rem]">
          <span class="flex items-center gap-2 rounded-md border border-signal/25 bg-signal/[0.06] px-2.5 py-2 text-signal">
            <span class="mono">01</span> Identidad
          </span>
          <span class="h-px w-4 bg-edge-strong"></span>
          <span class="flex items-center gap-2 rounded-md border border-edge px-2.5 py-2 text-mist/60">
            <span class="mono">02</span> Plano
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

      <form [formGroup]="orgForm" (ngSubmit)="crear()" class="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <!-- Columna principal -->
        <div class="min-w-0 space-y-5 lg:col-span-8">
          <!-- Identidad -->
          <section class="panel rise-2">
            <div class="flex items-center justify-between border-b border-edge px-6 py-4">
              <div class="section-head mb-0">
                <span class="section-num">01</span>
                <span class="section-title">Identidad de la sede</span>
              </div>
              <span class="mono hidden text-[0.52rem] uppercase tracking-[0.16em] text-mist sm:inline">Datos maestros</span>
            </div>

            <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="label" for="nombre">Nombre de la organización</label>
                <input id="nombre" type="text" formControlName="nombre" placeholder="Ej. Parqueadero MetroMall S.A." class="field" />
              </div>

              <div>
                <label class="label" for="nit">NIT / Identificación fiscal</label>
                <input id="nit" type="text" formControlName="nit" placeholder="890.984.812-5" class="field field-mono" />
                @if (orgForm.controls.nit.touched && orgForm.controls.nit.hasError('pattern')) {
                  <p class="mt-1 text-[0.58rem] leading-relaxed text-danger">Solo números, puntos y guiones. Ej. 890.984.812-5</p>
                }
              </div>

              <div>
                <label class="label" for="tipoEntidad">Tipo de entidad</label>
                <select id="tipoEntidad" formControlName="tipoEntidad" class="field">
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Mixto">Mixto</option>
                  <option value="Publico">Público</option>
                  <option value="Privado">Privado</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <div class="mb-1.5 flex flex-wrap items-end justify-between gap-2">
                  <label class="label mb-0" for="direccion">Ubicación y dirección</label>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                      type="button"
                      (click)="ubicarDireccion()"
                      class="mono inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.12em] text-flow transition-colors hover:text-chalk"
                      title="Mover el pin a la dirección escrita"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="6.5" stroke-width="1.8"></circle>
                        <path stroke-linecap="round" stroke-width="1.8" d="m16 16 4.5 4.5"></path>
                      </svg>
                      Ubicar dirección
                    </button>
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
                </div>

                <div class="relative overflow-hidden rounded-lg border border-edge bg-[#070a10]">
                  <div id="mapa-osm" class="map-dark z-0 h-[19rem] w-full"></div>
                  <div class="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded border border-edge/80 bg-void/85 px-2.5 py-1.5 text-[0.6rem] text-mist backdrop-blur">
                    <span class="h-1.5 w-1.5 rounded-full bg-signal"></span>
                    Haz clic en el mapa para fijar la sede
                  </div>
                  <span class="pointer-events-none absolute left-2 top-2 z-[500] h-4 w-4 border-l border-t border-signal/60"></span>
                  <span class="pointer-events-none absolute bottom-2 left-2 z-[500] h-4 w-4 border-b border-l border-signal/60"></span>
                  <span class="pointer-events-none absolute bottom-2 right-2 z-[500] h-4 w-4 border-b border-r border-signal/60"></span>
                </div>

                <input
                  id="direccion"
                  type="text"
                  formControlName="direccion"
                  (blur)="alSalirDireccion()"
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
        </div>

        <!-- Columna lateral -->
        <aside class="min-w-0 space-y-4 lg:sticky lg:top-24 lg:col-span-4">
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
                  <dt class="text-mist">Zona horaria</dt>
                  <dd class="mono font-medium text-chalk" title="Se calcula automáticamente según la ubicación del pin">{{ orgForm.value.zonaHoraria }}</dd>
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
  /** true cuando el usuario colocó el pin a mano (clic, arrastre o GPS). */
  private pinManual = false;
  /** Dirección que se obtuvo del pin; evita regeocodificarla en el blur. */
  private direccionDesdePin = '';
  private busquedaDireccion: { consulta: string; promesa: Promise<{ lat: number; lng: number } | null> } | null = null;

  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  miniauras = Array.from({ length: 12 }, (_, i) => i);

  orgForm = this.fb.group({
    nombre: ['', [Validators.required]],
    nit: ['', [Validators.required, Validators.pattern(/^[0-9]+(?:[.\-][0-9]+)*$/)]],
    tipoEntidad: ['Residencial', [Validators.required]],
    direccion: ['', [Validators.required]],
    descripcion: [''],
    totalPuestos: [24, [Validators.required, Validators.min(1)]],
    limiteMiembros: [100, [Validators.required, Validators.min(1)]],
    zonaHoraria: ['America/Bogota', [Validators.required]],
    latitud: [6.172],
    longitud: [-75.609],
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
      maxZoom: 19
    }).addTo(this.map);

    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="width:26px;height:38px;filter:drop-shadow(0 10px 10px rgba(0,0,0,.45))">
        <svg width="26" height="38" viewBox="0 0 26 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 1.5C6.65 1.5 1.5 6.65 1.5 13c0 8.4 11.5 23.5 11.5 23.5S24.5 21.4 24.5 13C24.5 6.65 19.35 1.5 13 1.5Z" fill="#5d8bff" stroke="#080b0f" stroke-width="1.6"/>
          <circle cx="13" cy="12.7" r="4.4" fill="#080b0f"/>
        </svg>
      </div>`,
      iconSize: [26, 38],
      iconAnchor: [13, 37]
    });

    this.marker = L.marker([latDefault, lngDefault], { icon: pinIcon, draggable: true }).addTo(this.map);
    this.actualizarZonaHoraria(latDefault, lngDefault);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
        this.actualizarUbicacion(e.latlng.lat, e.latlng.lng);
      }
    });

    this.marker.on('dragend', () => {
      if (this.marker) {
        const pos = this.marker.getLatLng();
        this.actualizarUbicacion(pos.lat, pos.lng);
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
          this.actualizarUbicacion(lat, lng);
        },
        (err) => {
          console.warn('No se pudo obtener la geolocalización:', err);
        }
      );
    }
  }

  /**
   * Guarda las coordenadas del pin en el formulario y actualiza la zona
   * horaria y la dirección. El editor de planos usa estas coordenadas para
   * centrar su vista satélite.
   */
  private actualizarUbicacion(lat: number, lng: number): void {
    this.pinManual = true;
    this.orgForm.patchValue({ latitud: lat, longitud: lng });
    this.actualizarZonaHoraria(lat, lng);
    this.geocodificarInverso(lat, lng);
  }

  /**
   * Busca la dirección escrita y mueve el pin hasta ese punto. Así las
   * coordenadas guardadas siempre corresponden a la ubicación de la sede.
   */
  ubicarDireccion(): void {
    const direccion = (this.orgForm.controls.direccion.value || '').trim();
    if (!direccion || direccion === this.direccionDesdePin) return;

    this.buscarCoordenadasDireccion(direccion).then((coords) => {
      if (!coords) {
        this.errorMensaje.set('No se encontró esa dirección. Puedes fijar el pin manualmente en el mapa.');
        return;
      }

      this.errorMensaje.set(null);
      this.map?.setView([coords.lat, coords.lng], 16);
      this.marker?.setLatLng([coords.lat, coords.lng]);
      this.actualizarUbicacion(coords.lat, coords.lng);
    });
  }

  /** Si el usuario escribió la dirección pero no movió el pin, lo ubica al salir. */
  alSalirDireccion(): void {
    if (!this.pinManual) this.ubicarDireccion();
  }

  /** Reutiliza la búsqueda en curso para no duplicar peticiones a Nominatim. */
  private buscarCoordenadasDireccion(direccion: string): Promise<{ lat: number; lng: number } | null> {
    if (this.busquedaDireccion?.consulta === direccion) {
      return this.busquedaDireccion.promesa;
    }

    const promesa = fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(direccion)}`)
      .then(res => res.json())
      .then((lista: Array<{ lat: string; lon: string }>) => {
        if (!lista?.length) return null;

        const lat = Number.parseFloat(lista[0].lat);
        const lng = Number.parseFloat(lista[0].lon);
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
      })
      .catch(() => null);

    this.busquedaDireccion = { consulta: direccion, promesa };
    return promesa;
  }

  /** La zona horaria se deduce de las coordenadas reales del pin. */
  private actualizarZonaHoraria(lat: number, lng: number): void {
    try {
      const zona = tzlookup(lat, lng);
      if (zona && zona !== this.orgForm.controls.zonaHoraria.value) {
        this.orgForm.controls.zonaHoraria.setValue(zona);
      }
    }
    catch {
      // Si el punto no se puede resolver, se conserva la zona actual.
    }
  }

  private geocodificarInverso(lat: number, lng: number): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.direccionDesdePin = data.display_name;
          this.orgForm.patchValue({ direccion: data.display_name });
        }
      })
      .catch(() => {});
  }

  crear(): void {
    const nit = this.orgForm.controls.nit;
    if (nit.hasError('pattern')) {
      nit.markAsTouched();
      this.errorMensaje.set('El NIT solo puede contener números, puntos y guiones. Ej. 890.984.812-5');
      return;
    }

    if (this.orgForm.invalid) {
      this.errorMensaje.set('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    // Si escribió la dirección pero no movió el pin, se geocodifica antes de
    // guardar para que la sede no quede con coordenadas por defecto.
    const direccion = (this.orgForm.controls.direccion.value || '').trim();
    const debeUbicar = !this.pinManual && !!direccion && direccion !== this.direccionDesdePin;

    const ubicacion = debeUbicar
      ? this.buscarCoordenadasDireccion(direccion)
      : Promise.resolve(null);

    ubicacion.then((coords) => {
      if (debeUbicar && !coords) {
        this.cargando.set(false);
        this.errorMensaje.set('No se pudo ubicar la dirección. Fija el pin manualmente en el mapa o corrige la dirección antes de crear la sede.');
        return;
      }

      if (coords) {
        this.orgForm.patchValue({ latitud: coords.lat, longitud: coords.lng });
        this.actualizarZonaHoraria(coords.lat, coords.lng);
      }

      this.enviarCreacion();
    });
  }

  private enviarCreacion(): void {
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
