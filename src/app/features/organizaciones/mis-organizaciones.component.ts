import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { AuthService } from '../../core/services/auth.service';
import { Organizacion } from '../../core/models';

@Component({
  selector: 'app-mis-organizaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <!-- Header with description and stats badge (Slide 6) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Mis Organizaciones</h1>
          <p class="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Selecciona la sede o estacionamiento al que deseas acceder hoy. Podrás visualizar el mapa interactivo de casillas en tiempo real, reservar tu puesto y gestionar tu acceso vehicular.
          </p>
        </div>

        <!-- Metric counter card (Slide 6) -->
        <div class="flex items-center gap-4">
          <div class="px-5 py-3.5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl flex items-center gap-4 shadow-lg shadow-blue-500/10">
            <div>
              <div class="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Sedes Vinculadas</div>
              <div class="text-2xl font-black text-white leading-none mt-0.5">{{ organizaciones().length }}</div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>

          @if (authService.userRole() === 'administrador') {
            <a
              routerLink="/organizaciones/crear"
              class="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Nueva Sede
            </a>
          }
        </div>
      </div>

      <!-- State: Loading -->
      @if (cargando()) {
        <div class="py-20 flex flex-col items-center justify-center text-slate-400">
          <div class="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p class="text-xs">Cargando sedes vinculadas...</p>
        </div>
      }

      <!-- State: Empty list -->
      @if (!cargando() && organizaciones().length === 0) {
        <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div class="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white">Aún no estás vinculado a ninguna sede</h3>
          <p class="text-xs text-slate-400 mt-2 mb-6">
            Ingresa un código de invitación proporcionado por un administrador para acceder al mapa del parqueadero.
          </p>
          <a
            routerLink="/unirse"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20"
          >
            Ingresar Código de Invitación
          </a>
        </div>
      }

      <!-- Grid of Organization Cards (Slide 6) -->
      @if (!cargando() && organizaciones().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (org of organizaciones(); track org._id) {
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 hover:shadow-2xl transition-all group flex flex-col justify-between">
              <div>
                <!-- Mock parking visual header banner with badges -->
                <div class="h-36 bg-gradient-to-tr from-slate-800 via-blue-950 to-slate-900 relative p-4 flex flex-col justify-between overflow-hidden">
                  <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

                  <!-- Type Badge -->
                  <div class="flex items-center justify-between relative z-10">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 border border-slate-700 text-blue-400 backdrop-blur">
                      {{ org.tipoEntidad }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 bg-slate-950/60 border border-slate-800">
                      CÓD: {{ org.codigoInvitacion }}
                    </span>
                  </div>

                  <!-- Name and icon -->
                  <div class="relative z-10">
                    <h3 class="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {{ org.nombre }}
                    </h3>
                    <p class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {{ org.direccion }}
                    </p>
                  </div>
                </div>

                <!-- Info Metrics -->
                <div class="p-5">
                  <div class="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 text-xs mb-4">
                    <div>
                      <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Puestos Totales</span>
                      <span class="text-sm font-bold text-white">{{ org.totalPuestos }} Espacios</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Operación</span>
                      <span class="text-sm font-bold text-emerald-400">{{ org.acceso24_7 ? '24/7 Abierto' : 'Horario Diurno' }}</span>
                    </div>
                  </div>

                  @if (org.descripcion) {
                    <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {{ org.descripcion }}
                    </p>
                  }
                </div>
              </div>

              <!-- Action button -->
              <div class="px-5 pb-5">
                <a
                  [routerLink]="['/mapa', org._id]"
                  class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Entrar a Organización</span>
                  <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </a>
              </div>
            </div>
          }
        </div>

        <!-- Join with code banner (Slide 6 wireframe bottom) -->
        <div class="mt-10 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <div class="w-12 h-12 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">¿Tienes un nuevo código de organización?</h4>
              <p class="text-xs text-slate-400 mt-0.5">Si tu empresa te ha asignado un código de invitación, únete aquí para sincronizar tu acceso vehicular.</p>
            </div>
          </div>
          <a
            routerLink="/unirse"
            class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all shrink-0"
          >
            Ingresar código aquí
          </a>
        </div>
      }

      <!-- Privacy & Trust Disclaimer (Slide 6 wireframe bottom) -->
      <div class="mt-12 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
        <svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
        <span>
          <strong>Seguridad y Privacidad Corporativa:</strong> Toda tu información está protegida bajo estándares de alta seguridad. Solo las organizaciones en las que has sido aceptado pueden ver tu historial de acceso y placas de vehículo.
        </span>
      </div>
    </main>
  `
})
export class MisOrganizacionesComponent implements OnInit {
  private organizacionService = inject(OrganizacionService);
  authService = inject(AuthService);

  organizaciones = signal<Organizacion[]>([]);
  cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.organizacionService.misOrganizaciones().subscribe({
      next: (orgs) => {
        this.organizaciones.set(orgs);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando organizaciones:', err);
        this.cargando.set(false);
      }
    });
  }
}
