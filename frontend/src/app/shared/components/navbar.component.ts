import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CasillaService } from '../../core/services/casilla.service';
import { Casilla, Organizacion } from '../../core/models';
import { ThemeToggleComponent } from './theme-toggle.component';

type Resultado =
  | { tipo: 'sede'; orgId: string; titulo: string; sub: string }
  | { tipo: 'puesto'; orgId: string; titulo: string; sub: string; estado: string };

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  template: `
    <header class="sticky top-0 z-50">
      <div class="border-b border-edge/90 bg-void/82 backdrop-blur-xl">
        <div class="mx-auto flex h-16 max-w-[92rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <!-- Marca -->
          <a routerLink="/organizaciones" class="group flex shrink-0 items-center gap-3">
            <div class="brand-glow notch-sm relative grid h-10 w-10 place-items-center bg-signal text-void transition-transform duration-200 group-hover:-rotate-3">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square">
                <path d="M7.5 18V6h5.2a3.6 3.6 0 1 1 0 7.2H8.4" />
                <path d="M7.5 13.2h5.2" />
              </svg>
              <span class="absolute -bottom-px -right-px h-1.5 w-1.5 bg-flow"></span>
            </div>
            <span class="text-[1.32rem] font-bold leading-none tracking-[-0.04em] text-chalk">SGP</span>
          </a>

          <!-- Navegación -->
          <nav class="hidden items-center gap-1 lg:flex">
            <a
              routerLink="/organizaciones"
              routerLinkActive="text-chalk bg-white/[0.045]"
              class="rounded-md px-3 py-2 text-[0.72rem] font-medium text-mist transition-colors hover:bg-white/[0.035] hover:text-chalk"
            >
              Mis sedes
            </a>
            <a
              routerLink="/unirse"
              routerLinkActive="text-chalk bg-white/[0.045]"
              class="rounded-md px-3 py-2 text-[0.72rem] font-medium text-mist transition-colors hover:bg-white/[0.035] hover:text-chalk"
            >
              Unirse con código
            </a>
            @if (authService.currentUser()?.rol === 'administrador' || authService.currentUser()?.rol === 'guardia') {
              <a
                routerLink="/admin"
                routerLinkActive="text-chalk bg-white/[0.045]"
                class="flex items-center gap-2 rounded-md px-3 py-2 text-[0.72rem] font-medium text-mist transition-colors hover:bg-white/[0.035] hover:text-chalk"
              >
                Panel de control
                <span class="live-dot scale-75"></span>
              </a>
            }
          </nav>

          <!-- Buscador global -->
          <div class="hidden flex-1 justify-center md:flex lg:max-w-sm">
            <div class="relative w-full">
              <span class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-mist/70">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" stroke-width="2"></circle>
                  <path stroke-linecap="round" stroke-width="2" d="m20 20-3.4-3.4"></path>
                </svg>
              </span>
              <input
                #buscador
                type="text"
                role="combobox"
                aria-label="Buscar sede o puesto"
                [attr.aria-expanded]="abierto()"
                aria-controls="nav-resultados"
                autocomplete="off"
                placeholder="Buscar sede o puesto…"
                [value]="q()"
                (focus)="abrir()"
                (input)="actualizar($event)"
                (keydown.escape)="cerrar()"
                (keydown.enter)="irPrimero($event)"
                (keydown.arrowdown)="mover(1, $event)"
                (keydown.arrowup)="mover(-1, $event)"
                class="field h-9 rounded-md py-0 pl-9 pr-12 text-[0.72rem]"
              />
              <kbd class="mono pointer-events-none absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded border border-edge bg-white/[0.03] px-1.5 py-0.5 text-[0.55rem] text-mist">/</kbd>

              @if (abierto()) {
                <div
                  id="nav-resultados"
                  class="absolute left-0 right-0 top-[calc(100%+1rem)] z-50 overflow-hidden rounded-md border border-edge-strong bg-panel/98 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                >
                  <div class="flex items-center justify-between border-b border-edge px-3 py-2">
                    <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Búsqueda global</span>
                    <span class="mono text-[0.5rem] text-mist/60">{{ resultados().length }} resultado(s)</span>
                  </div>

                  @if (cargando()) {
                    <div class="flex items-center gap-2 px-3 py-4 text-[0.65rem] text-mist">
                      <span class="h-3 w-3 animate-spin rounded-full border-2 border-mist/30 border-t-signal"></span>
                      Indexando sedes y puestos…
                    </div>
                  } @else if (q().trim().length < 2) {
                    <p class="px-3 py-4 text-[0.65rem] leading-relaxed text-mist">
                      Escribe al menos 2 caracteres para buscar una sede o un puesto.
                    </p>
                  } @else if (resultados().length === 0) {
                    <p class="px-3 py-4 text-[0.65rem] leading-relaxed text-mist">
                      Sin coincidencias para <span class="mono text-chalk">“{{ q().trim() }}”</span>.
                    </p>
                  } @else {
                    <ul class="max-h-80 overflow-auto py-1">
                      @for (r of resultados(); track r.tipo + r.orgId + r.titulo; let i = $index) {
                        <li>
                          <button
                            type="button"
                            (click)="ir(r)"
                            (mouseenter)="activo.set(i)"
                            class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors"
                            [ngClass]="activo() === i ? 'bg-signal/[0.07]' : 'hover:bg-white/[0.03]'"
                          >
                            <span class="flex min-w-0 items-center gap-2.5">
                              <span
                                class="mono grid h-6 w-6 shrink-0 place-items-center rounded-sm border text-[0.5rem]"
                                [ngClass]="r.tipo === 'sede' ? 'border-flow/35 bg-flow/[0.08] text-flow' : 'border-signal/30 bg-signal/[0.06] text-signal'"
                              >
                                {{ r.tipo === 'sede' ? 'SD' : 'PS' }}
                              </span>
                              <span class="min-w-0">
                                <span class="block truncate text-[0.7rem] font-medium text-chalk">{{ r.titulo }}</span>
                                <span class="mono block truncate text-[0.5rem] uppercase tracking-[0.1em] text-mist">{{ r.sub }}</span>
                              </span>
                            </span>
                            @if (r.tipo === 'puesto') {
                              <span
                                class="tag shrink-0"
                                [ngClass]="r.estado === 'libre' ? 'tag-ok' : 'tag-danger'"
                              >{{ r.estado }}</span>
                            } @else {
                              <span class="tag tag-muted shrink-0">Sede</span>
                            }
                          </button>
                        </li>
                      }
                    </ul>
                  }

                  <div class="flex items-center justify-between border-t border-edge px-3 py-1.5">
                    <span class="mono text-[0.45rem] uppercase tracking-[0.12em] text-mist/50">↑ ↓ navegar · Enter abrir · Esc cerrar</span>
                    <span class="mono text-[0.45rem] uppercase tracking-[0.12em] text-mist/50">/ enfocar</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Usuario -->
          <div class="relative flex items-center gap-2">
            <app-theme-toggle></app-theme-toggle>
            @if (authService.currentUser(); as user) {
              <div class="lg:hidden">
                <button
                  type="button"
                  (click)="alternarMenu($event)"
                  [attr.aria-expanded]="menuAbierto()"
                  aria-controls="menu-movil"
                  aria-label="Abrir menú de navegación"
                  class="btn btn-icon btn-ghost text-mist"
                >
                  @if (menuAbierto()) {
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6 6 18"></path>
                    </svg>
                  } @else {
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-width="1.8" d="M4 7h16M4 12h16M4 17h16"></path>
                    </svg>
                  }
                </button>

                @if (menuAbierto()) {
                  <div
                    id="menu-movil"
                    class="absolute right-0 top-[calc(100%+1rem)] z-50 w-60 overflow-hidden rounded-md border border-edge-strong bg-panel/98 shadow-[0_28px_70px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                  >
                    <div class="border-b border-edge px-3 py-2">
                      <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Navegación</span>
                    </div>
                    <nav class="p-1.5">
                      <a
                        routerLink="/organizaciones"
                        (click)="menuAbierto.set(false)"
                        routerLinkActive="bg-white/[0.05] text-chalk"
                        class="flex items-center gap-2.5 rounded px-2.5 py-2 text-[0.7rem] font-medium text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk"
                      >
                        <svg class="h-3.5 w-3.5 text-flow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5"></path>
                        </svg>
                        Mis sedes
                      </a>

                      <a
                        routerLink="/unirse"
                        (click)="menuAbierto.set(false)"
                        routerLinkActive="bg-white/[0.05] text-chalk"
                        class="flex items-center gap-2.5 rounded px-2.5 py-2 text-[0.7rem] font-medium text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk"
                      >
                        <svg class="h-3.5 w-3.5 text-mist" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7l6-6A6 6 0 1 1 21 9Z"></path>
                        </svg>
                        Unirse con código
                      </a>

                      @if (user.rol === 'administrador' || user.rol === 'guardia') {
                        <a
                          routerLink="/admin"
                          (click)="menuAbierto.set(false)"
                          routerLinkActive="bg-white/[0.05] text-chalk"
                          class="flex items-center gap-2.5 rounded px-2.5 py-2 text-[0.7rem] font-medium text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk"
                        >
                          <svg class="h-3.5 w-3.5 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 19V9m5 10V5m5 14v-7m5 7V11"></path>
                          </svg>
                          Panel de control
                          <span class="live-dot ml-auto scale-75"></span>
                        </a>
                      }
                    </nav>
                    <div class="border-t border-edge px-3 py-2">
                      <p class="mono text-[0.5rem] uppercase tracking-[0.12em] text-mist/60">{{ user.nombre }} {{ user.apellido }} · {{ user.rol }}</p>
                    </div>
                  </div>
                }
              </div>

              <div class="hidden items-center gap-2.5 border-l border-edge pl-3 sm:flex">
                <div class="notch-sm grid h-8 w-8 place-items-center bg-gradient-to-br from-flow/80 to-flow/30 text-[0.62rem] font-bold uppercase tracking-wide text-chalk">
                  {{ user.nombre.charAt(0) }}{{ user.apellido.charAt(0) }}
                </div>
                <div class="hidden leading-tight lg:block">
                  <p class="max-w-[9rem] truncate text-[0.7rem] font-semibold text-chalk">{{ user.nombre }} {{ user.apellido }}</p>
                  <span class="mono text-[0.52rem] uppercase tracking-[0.16em] text-mist">{{ user.rol }}</span>
                </div>
              </div>

              <button
                (click)="authService.logout()"
                title="Cerrar sesión"
                class="btn btn-icon btn-ghost ml-0.5 text-mist hover:border-danger/30 hover:text-danger"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17l5-5-5-5m5 5H9m3 5v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            } @else {
              <a routerLink="/login" class="btn btn-signal px-4">Acceder</a>
            }
          </div>
        </div>
      </div>
      <div class="h-px bg-gradient-to-r from-transparent via-signal/35 to-transparent"></div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private organizacionService = inject(OrganizacionService);
  private casillaService = inject(CasillaService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  q = signal('');
  abierto = signal(false);
  menuAbierto = signal(false);
  cargando = signal(false);
  activo = signal(0);

  private organizaciones = signal<Organizacion[]>([]);
  private casillas = signal<Array<{ orgId: string; orgNombre: string; casilla: Casilla }>>([]);
  private indexado = false;

  resultados = computed<Resultado[]>(() => {
    const termino = this.q().trim().toLowerCase();
    if (termino.length < 2) return [];

    const sedes: Resultado[] = this.organizaciones()
      .filter((o) => `${o.nombre} ${o.direccion} ${o.nit}`.toLowerCase().includes(termino))
      .slice(0, 3)
      .map((o) => ({ tipo: 'sede', orgId: o._id, titulo: o.nombre, sub: o.direccion }));

    const puestos: Resultado[] = this.casillas()
      .filter(({ casilla }) => casilla.codigo.toLowerCase().includes(termino))
      .slice(0, 8)
      .map(({ orgId, orgNombre, casilla }) => ({
        tipo: 'puesto',
        orgId,
        titulo: `${casilla.codigo} · ${casilla.seccion || 'Sin sección'}`,
        sub: orgNombre,
        estado: casilla.estado
      }));

    return [...puestos, ...sedes].slice(0, 9);
  });

  abrir(): void {
    this.menuAbierto.set(false);
    this.abierto.set(true);
    this.activo.set(0);
    this.indexar();
  }

  alternarMenu(event: Event): void {
    event.stopPropagation();
    this.abierto.set(false);
    this.menuAbierto.update((v) => !v);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  actualizar(event: Event): void {
    this.q.set((event.target as HTMLInputElement).value);
    this.activo.set(0);
    this.abierto.set(true);
    this.indexar();
  }

  mover(delta: number, event: Event): void {
    const total = this.resultados().length;
    if (!this.abierto() || total === 0) return;
    event.preventDefault();
    this.activo.set((this.activo() + delta + total) % total);
  }

  irPrimero(event: Event): void {
    if (!this.abierto()) return;
    const primero = this.resultados()[this.activo()] ?? this.resultados()[0];
    if (primero) {
      event.preventDefault();
      this.ir(primero);
    }
  }

  ir(resultado: Resultado): void {
    this.abierto.set(false);
    this.q.set('');
    if (resultado.tipo === 'puesto') {
      this.router.navigate(['/mapa', resultado.orgId], { queryParams: { casilla: resultado.titulo.split(' · ')[0] } });
    } else {
      this.router.navigate(['/mapa', resultado.orgId]);
    }
  }

  @HostListener('document:click', ['$event'])
  alClickExterno(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  atajoBusqueda(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.abierto.set(false);
      this.menuAbierto.set(false);
    }

    const objetivo = event.target as HTMLElement | null;
    const escribiendo = objetivo && (['INPUT', 'TEXTAREA', 'SELECT'].includes(objetivo.tagName) || objetivo.isContentEditable);
    if (event.key === '/' && !escribiendo && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const input = this.host.nativeElement.querySelector<HTMLInputElement>('input[role="combobox"]');
      if (input) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    }
  }

  private indexar(): void {
    if (this.indexado || this.cargando() || !this.authService.getToken()) return;
    this.cargando.set(true);

    forkJoin({
      orgs: this.organizacionService.todasOrganizaciones().pipe(catchError(() => of([] as Organizacion[]))),
      casillas: this.casillaService.todasCasillas().pipe(catchError(() => of([] as Casilla[])))
    }).subscribe({
      next: ({ orgs, casillas }) => {
        this.organizaciones.set(orgs);
        const nombres = new Map(orgs.map((org) => [org._id, org.nombre]));
        const plano: Array<{ orgId: string; orgNombre: string; casilla: Casilla }> = [];

        for (const casilla of casillas) {
          const orgNombre = nombres.get(casilla.organizacion);
          if (orgNombre) plano.push({ orgId: casilla.organizacion, orgNombre, casilla });
        }

        this.casillas.set(plano);
        this.cargando.set(false);
        this.indexado = true;
      },
      error: () => {
        this.cargando.set(false);
        this.indexado = true;
      }
    });
  }
}
