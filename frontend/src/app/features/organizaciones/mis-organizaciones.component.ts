import { Component, OnInit, signal, computed, inject } from '@angular/core';
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

    <main class="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <!-- Encabezado -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
        <span class="kicker">Consola / Sedes</span>
        <div class="flex items-center gap-4 text-[0.62rem] text-mist">
          <span class="mono hidden uppercase tracking-[0.14em] text-mist/50 sm:inline">{{ hoy }}</span>
        </div>
      </div>

      <div class="mt-8 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div class="rise">
          <h1 class="max-w-2xl break-words text-[2.25rem] font-semibold leading-[0.96] tracking-[-0.045em] text-chalk sm:text-5xl">
            Tus sedes,<br class="sm:hidden" />
            <span class="text-outline">en un solo plano.</span>
          </h1>
          <p class="mt-4 max-w-xl text-[0.8rem] leading-relaxed text-mist">
            Elige una sede para ver el estado del parqueadero, reservar tu puesto o entrar al editor de planos si eres administrador.
          </p>
        </div>

        <div class="rise-2 flex flex-wrap items-stretch gap-2.5">
          <div class="panel-flat relative flex min-w-[8.5rem] flex-col justify-between overflow-hidden px-4 py-3.5">
            <span class="mono text-[0.52rem] uppercase tracking-[0.18em] text-mist">Sedes vinculadas</span>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-semibold leading-none tracking-tight text-chalk">{{ organizaciones().length }}</span>
              <span class="mono mb-0.5 text-[0.55rem] text-signal">ACTIVAS</span>
            </div>
            <span class="absolute right-0 top-0 h-full w-0.5 bg-signal"></span>
          </div>

          @if (authService.userRole() === 'administrador') {
            <a routerLink="/organizaciones/crear" class="btn btn-signal min-h-[4.8rem] flex-col gap-2 px-5 text-center">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"></path>
              </svg>
              <span>Nueva sede</span>
            </a>
          }
        </div>
      </div>

      <!-- Métricas -->
      @if (!cargando() && organizaciones().length > 0) {
        <div class="rise-3 mt-8 grid grid-cols-2 gap-2.5 max-[359px]:grid-cols-1 sm:grid-cols-4">
          <div class="panel-flat flex items-center gap-3 px-4 py-3">
            <span class="grid h-8 w-8 place-items-center rounded-md border border-flow/25 bg-flow/[0.07] text-flow">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 21h3M9 7h3M9 11h3M9 21v-5h3v5"></path>
              </svg>
            </span>
            <div class="min-w-0">
              <div class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Puestos totales</div>
              <div class="break-words text-lg font-semibold leading-tight text-chalk">{{ totalPuestos() }}</div>
            </div>
          </div>

          <div class="panel-flat flex items-center gap-3 px-4 py-3">
            <span class="grid h-8 w-8 place-items-center rounded-md border border-ok/25 bg-ok/[0.07] text-ok">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12h4l2.5-7 4 14 2.5-7h5"></path>
              </svg>
            </span>
            <div class="min-w-0">
              <div class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Operación</div>
              <div class="break-words text-lg font-semibold leading-tight text-chalk">Tiempo real</div>
            </div>
          </div>

          <div class="panel-flat flex items-center gap-3 px-4 py-3">
            <span class="grid h-8 w-8 place-items-center rounded-md border border-signal/25 bg-signal/[0.07] text-signal">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z"></path>
              </svg>
            </span>
            <div class="min-w-0">
              <div class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Acceso</div>
              <div class="break-words text-lg font-semibold leading-tight text-chalk">Privado</div>
            </div>
          </div>

          <div class="panel-flat flex items-center gap-3 px-4 py-3">
            <span class="grid h-8 w-8 place-items-center rounded-md border border-warn/25 bg-warn/[0.07] text-warn">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M4 12h10M4 17h7"></path>
              </svg>
            </span>
            <div class="min-w-0">
              <div class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Rol</div>
              <div class="break-words text-lg font-semibold capitalize leading-tight text-chalk">{{ authService.userRole() }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Cargando -->
      @if (cargando()) {
        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (n of [1, 2, 3]; track n) {
            <div class="panel h-[21rem] animate-pulse p-5">
              <div class="h-28 rounded-lg bg-white/[0.035]"></div>
              <div class="mt-5 h-4 w-2/3 rounded bg-white/[0.05]"></div>
              <div class="mt-2 h-3 w-1/2 rounded bg-white/[0.035]"></div>
              <div class="mt-8 h-10 rounded-md bg-white/[0.035]"></div>
            </div>
          }
        </div>
      }

      <!-- Vacío -->
      @if (!cargando() && organizaciones().length === 0) {
        <div class="panel notch mx-auto mt-10 max-w-2xl overflow-hidden">
          <div class="relative flex h-40 items-center justify-center overflow-hidden border-b border-edge bg-[#070a10]">
            <div class="absolute inset-0 dot-grid opacity-40"></div>
            <div class="absolute inset-0 bg-gradient-to-br from-flow/10 via-transparent to-signal/10"></div>
            <div class="notch-sm relative grid h-16 w-16 place-items-center border border-signal/25 bg-signal/[0.07] text-signal">
              <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 21h3M9 7h3M9 11h3M9 21v-5h3v5"></path>
              </svg>
            </div>
          </div>
          <div class="p-8 text-center">
            <h2 class="text-xl font-semibold tracking-tight text-chalk">Todavía no tienes sedes</h2>
            <p class="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-mist">
              Únete con un código de invitación o crea tu primera sede si eres administrador.
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-2.5">
              <a routerLink="/unirse" class="btn btn-signal">Ingresar código</a>
              @if (authService.userRole() === 'administrador') {
                <a routerLink="/organizaciones/crear" class="btn btn-ghost">Crear sede</a>
              }
            </div>
          </div>
        </div>
      }

      <!-- Sedes -->
      @if (!cargando() && organizaciones().length > 0) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (org of organizaciones(); track org._id; let i = $index) {
            <article class="panel notch group relative flex flex-col overflow-hidden lift">
              <!-- Cabecera visual -->
              <div class="relative h-36 overflow-hidden border-b border-edge bg-[#070a10]">
                <div class="absolute inset-0 line-grid opacity-40"></div>
                <div class="absolute inset-0 bg-gradient-to-br from-flow/[0.11] via-transparent to-signal/[0.06]"></div>
                <div class="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
                  <div class="flex items-end gap-[3px] opacity-60">
                    @for (bay of miniauras; track $index) {
                      <span
                        class="w-[7px] rounded-t-[2px] border border-t-0"
                        [class]="bay % 4 === 0
                          ? 'h-8 border-danger/45 bg-danger/[0.12]'
                          : 'h-10 border-ok/35 bg-ok/[0.09]'"
                      ></span>
                    }
                  </div>
                  <span class="mono text-[0.5rem] uppercase tracking-[0.18em] text-mist/50">Nivel 01</span>
                </div>
                <div class="absolute inset-x-4 top-4 flex items-start justify-between">
                  <span class="tag tag-flow">{{ org.tipoEntidad }}</span>
                  <span class="mono text-4xl font-semibold leading-none text-white/[0.07]">{{ (i + 1).toString().padStart(2, '0') }}</span>
                </div>
                <div class="absolute left-4 top-4 mt-8 h-px w-10 bg-signal/70"></div>
              </div>

              <div class="flex flex-1 flex-col p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="truncate text-lg font-semibold tracking-[-0.02em] text-chalk transition-colors group-hover:text-signal">{{ org.nombre }}</h2>
                    <p class="mt-1 flex items-start gap-1.5 text-[0.66rem] leading-snug text-mist">
                      <svg class="mt-0.5 h-3 w-3 shrink-0 text-mist/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"></path>
                        <circle cx="12" cy="10" r="2.4" stroke-width="1.7"></circle>
                      </svg>
                      <span class="line-clamp-2">{{ org.direccion }}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    (click)="copiarCodigo(org)"
                    class="mono shrink-0 rounded border border-edge bg-white/[0.02] px-1.5 py-1 text-[0.5rem] uppercase tracking-[0.12em] text-mist transition-colors hover:border-signal/35 hover:text-signal"
                    [title]="'Copiar código ' + org.codigoInvitacion"
                  >
                    @if (codigoCopiado() === org._id) { ✓ copiado } @else { {{ org.codigoInvitacion }} }
                  </button>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge bg-edge">
                  <div class="bg-[#0a0e15] px-3 py-2.5">
                    <div class="mono text-[0.48rem] uppercase tracking-[0.16em] text-mist">Puestos</div>
                    <div class="mt-0.5 text-sm font-semibold text-chalk">{{ org.totalPuestos }} <span class="text-[0.55rem] font-normal text-mist">espacios</span></div>
                  </div>
                  <div class="bg-[#0a0e15] px-3 py-2.5">
                    <div class="mono text-[0.48rem] uppercase tracking-[0.16em] text-mist">Operación</div>
                    <div class="mt-0.5 text-sm font-semibold" [class]="org.acceso24_7 ? 'text-ok' : 'text-warn'">
                      {{ org.acceso24_7 ? '24/7' : 'Diurno' }}
                    </div>
                  </div>
                </div>

                @if (org.descripcion) {
                  <p class="mt-3 line-clamp-2 text-[0.68rem] leading-relaxed text-mist/80">{{ org.descripcion }}</p>
                }

                <div class="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  @if (authService.userRole() === 'administrador' && esCreador(org)) {
                    <a
                      [routerLink]="['/organizaciones', org._id, 'disenador']"
                      class="btn btn-ghost flex-1 border-edge"
                      title="Abrir editor de planos"
                    >
                      <svg class="h-3.5 w-3.5 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                      </svg>
                      Plano
                    </a>
                  }
                  <a
                    [routerLink]="['/mapa', org._id]"
                    class="btn btn-signal flex-1"
                  >
                    Abrir sede
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Banner unirse -->
        <div class="panel-rail mt-8 flex flex-col items-center justify-between gap-4 overflow-hidden p-5 sm:flex-row sm:p-6">
          <div class="flex items-center gap-4 text-center sm:text-left">
            <span class="notch-sm hidden h-11 w-11 shrink-0 place-items-center border border-flow/25 bg-flow/[0.08] text-flow sm:grid">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7l6-6A6 6 0 1 1 21 9Z"></path>
              </svg>
            </span>
            <div>
              <h3 class="text-sm font-semibold text-chalk">¿Tienes un nuevo código de organización?</h3>
              <p class="mt-0.5 text-[0.7rem] text-mist">Vincula tu cuenta y sincroniza tu acceso vehicular en segundos.</p>
            </div>
          </div>
          <a routerLink="/unirse" class="btn btn-ghost shrink-0 border-flow/25 text-flow hover:border-flow/50 hover:text-chalk">
            Ingresar código
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
            </svg>
          </a>
        </div>
      }

      <!-- Nota -->
      <div class="mt-8 flex items-start gap-2.5 border-t border-edge pt-5 text-[0.65rem] leading-relaxed text-mist/70">
        <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m9 12 2 2 4-4"></path>
        </svg>
        <span>
          <strong class="text-mist">Seguridad y privacidad corporativa.</strong>
          Solo las organizaciones en las que has sido aceptado pueden ver tu historial de acceso y placas de vehículo.
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
  codigoCopiado = signal<string | null>(null);
  miniauras = Array.from({ length: 10 }, (_, i) => i);
  hoy = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  totalPuestos = computed(() => this.organizaciones().reduce((total, org) => total + (org.totalPuestos || 0), 0));

  /** El editor de planos solo está disponible para quien creó la sede. */
  esCreador(org: Organizacion): boolean {
    return org.creadoPor === this.authService.currentUser()?._id;
  }

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

  async copiarCodigo(org: Organizacion): Promise<void> {
    try {
      await navigator.clipboard.writeText(org.codigoInvitacion);
      this.codigoCopiado.set(org._id);
      setTimeout(() => {
        if (this.codigoCopiado() === org._id) this.codigoCopiado.set(null);
      }, 1600);
    } catch {
      // Fallback silencioso: el código siempre está visible en la tarjeta.
    }
  }
}
