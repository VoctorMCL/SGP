import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { OrganizacionService } from '../../core/services/organizacion.service';

@Component({
  selector: 'app-unirse-codigo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <a routerLink="/organizaciones" class="group inline-flex items-center gap-2 text-[0.7rem] font-medium text-mist transition-colors hover:text-chalk">
        <svg class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m5 5-5-5 5-5"></path>
        </svg>
        Volver a mis sedes
      </a>

      <div class="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <!-- Formulario -->
        <section class="panel notch rise lg:col-span-7">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-6 py-3.5 sm:px-8">
            <span class="mono text-[0.58rem] uppercase tracking-[0.2em] text-mist">Invitación / Canje</span>
            <span class="tag tag-signal"><span class="live-dot scale-75"></span> Validación en vivo</span>
          </div>

          <div class="p-6 sm:p-8">
            <div class="notch-sm mb-5 grid h-11 w-11 place-items-center border border-signal/25 bg-signal/[0.07] text-signal">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7l6-6A6 6 0 1 1 21 9Z"></path>
              </svg>
            </div>

            <h1 class="text-2xl font-semibold tracking-[-0.035em] text-chalk sm:text-3xl">Canjea tu código de acceso</h1>
            <p class="mt-2 max-w-lg text-xs leading-relaxed text-mist sm:text-[0.8rem]">
              Introduce el código que te entregó tu administrador para vincular tu cuenta a la red privada de estacionamientos de la sede.
            </p>

            <form (ngSubmit)="unirse()" class="mt-7 space-y-4">
              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label class="label mb-0" for="codigo">Código de organización</label>
                  <button type="button" (click)="pegarCodigo()" class="mono text-[0.55rem] uppercase tracking-[0.14em] text-mist transition-colors hover:text-signal">
                    Pegar código
                  </button>
                </div>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-signal/60">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 11V7a4 4 0 1 1 8 0v4M6 11h12v10H6z"></path>
                    </svg>
                  </span>
                  <input
                    id="codigo"
                    type="text"
                    [(ngModel)]="codigoInvitacion"
                    name="codigoInvitacion"
                    placeholder="SGP-XXXXXX"
                    required
                    autocomplete="off"
                    spellcheck="false"
                    class="field field-mono h-14 pl-11 pr-4 text-base uppercase tracking-[0.18em]"
                  />
                </div>
                <p class="mt-2 flex items-center gap-1.5 text-[0.6rem] text-mist/60">
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke-width="1.6"></circle>
                    <path stroke-linecap="round" stroke-width="1.6" d="M12 11v5m0-8.5v.01"></path>
                  </svg>
                  El código no distingue entre mayúsculas y minúsculas.
                </p>
              </div>

              @if (errorMensaje()) {
                <div class="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/[0.07] p-3 text-[0.7rem] leading-relaxed text-danger">
                  <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke-width="1.8"></circle>
                    <path stroke-linecap="round" stroke-width="1.8" d="M12 8v4m0 3.5v.01"></path>
                  </svg>
                  <span>{{ errorMensaje() }}</span>
                </div>
              }

              @if (exitoMensaje()) {
                <div class="flex items-start gap-2.5 rounded-md border border-ok/30 bg-ok/[0.07] p-3 text-[0.7rem] leading-relaxed text-ok">
                  <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
                  </svg>
                  <span>{{ exitoMensaje() }}</span>
                </div>
              }

              <button
                type="submit"
                [disabled]="cargando() || !codigoInvitacion.trim()"
                class="btn btn-signal h-11 w-full"
              >
                @if (cargando()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                  <span>Validando código…</span>
                } @else {
                  <span>Vincular mi cuenta</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                  </svg>
                }
              </button>
            </form>

            <div class="mt-7 border-t border-edge pt-5">
              <h3 class="mono mb-3 text-[0.55rem] uppercase tracking-[0.2em] text-mist">¿Dónde encuentro mi código?</h3>
              <ul class="space-y-2 text-[0.7rem] leading-relaxed text-mist">
                <li class="flex gap-2"><span class="mono text-signal">01</span> Solicítalo al administrador o a la administración del conjunto.</li>
                <li class="flex gap-2"><span class="mono text-signal">02</span> Revísalo en el correo de bienvenida de tu organización.</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Panel lateral -->
        <aside class="space-y-5 lg:col-span-5">
          <div class="panel notch-tr overflow-hidden rise-2">
            <div class="relative h-32 overflow-hidden border-b border-edge bg-[#070a10]">
              <div class="absolute inset-0 line-grid opacity-60"></div>
              <div class="absolute inset-0 bg-gradient-to-br from-flow/10 via-transparent to-signal/10"></div>
              <div class="absolute inset-x-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
                <span class="mono text-[0.5rem] uppercase tracking-[0.18em] text-mist">Red</span>
                <div class="relative h-px flex-1 border-t border-dashed border-white/20"></div>
                <div class="notch-sm grid h-12 w-12 place-items-center border border-signal/30 bg-signal/10 text-signal">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21V9m0 0 4 4m-4-4-4 4M5 5h14"></path>
                  </svg>
                </div>
                <div class="relative h-px flex-1 border-t border-dashed border-white/20"></div>
                <span class="mono text-[0.5rem] uppercase tracking-[0.18em] text-mist">Sede</span>
              </div>
              <div class="absolute bottom-3 left-5 right-5 flex items-center justify-between">
                <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/60">Conexión cifrada</span>
                <span class="mono text-[0.5rem] text-ok">● activa</span>
              </div>
            </div>

            <div class="p-5">
              <h2 class="text-sm font-semibold text-chalk">Acceso mediante invitación</h2>
              <p class="mt-1.5 text-[0.7rem] leading-relaxed text-mist">
                Solo los miembros autorizados pueden ver el plano, reservar puestos y consultar la ocupación de esta sede.
              </p>
              <div class="mt-4 space-y-2.5">
                <div class="flex items-center gap-2.5 rounded-md border border-edge bg-white/[0.02] px-3 py-2.5">
                  <span class="tag tag-ok">01</span>
                  <span class="text-[0.68rem] text-mist">Validación instantánea con el servidor</span>
                </div>
                <div class="flex items-center gap-2.5 rounded-md border border-edge bg-white/[0.02] px-3 py-2.5">
                  <span class="tag tag-flow">02</span>
                  <span class="text-[0.68rem] text-mist">Acceso al mapa y reservas al instante</span>
                </div>
                <div class="flex items-center gap-2.5 rounded-md border border-edge bg-white/[0.02] px-3 py-2.5">
                  <span class="tag tag-signal">03</span>
                  <span class="text-[0.68rem] text-mist">Sincronización en tiempo real</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-flat flex items-start gap-3 p-4">
            <span class="mt-0.5 text-signal">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 3 5 6v5c0 4.4 2.9 8.3 7 9.5 4.1-1.2 7-5.1 7-9.5V6l-7-3Z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <p class="text-[0.68rem] leading-relaxed text-mist">
              <strong class="text-chalk">Privacidad corporativa.</strong> Tu historial y placas solo son visibles para las organizaciones a las que perteneces.
            </p>
          </div>
        </aside>
      </div>
    </main>
  `
})
export class UnirseCodigoComponent {
  private organizacionService = inject(OrganizacionService);
  private router = inject(Router);

  codigoInvitacion = '';
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  exitoMensaje = signal<string | null>(null);

  async pegarCodigo(): Promise<void> {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto?.trim()) this.codigoInvitacion = texto.trim().toUpperCase();
    } catch {
      // El navegador puede bloquear el portapapeles: el usuario puede escribir el código.
    }
  }

  unirse(): void {
    if (!this.codigoInvitacion.trim()) return;

    this.cargando.set(true);
    this.errorMensaje.set(null);
    this.exitoMensaje.set(null);

    this.organizacionService.unirse(this.codigoInvitacion.trim()).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.exitoMensaje.set(`¡Te has unido exitosamente a "${res.organizacion.nombre}"!`);
        setTimeout(() => {
          this.router.navigate(['/mapa', res.organizacion._id]);
        }, 1200);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Código de invitación inválido o no encontrado.');
      }
    });
  }
}
