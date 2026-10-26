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

    <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <!-- Back link -->
      <a routerLink="/organizaciones" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Volver a Mis Sedes
      </a>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Input section (Left) -->
        <div class="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>

          <h2 class="text-2xl font-bold text-white tracking-tight">Ingresar Código de Invitación</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Si tu empresa, conjunto residencial u organización te ha proporcionado un código de acceso, ingrésalo aquí para unirte a su red privada de estacionamientos.
          </p>

          <form (ngSubmit)="unirse()" class="mt-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Código de Organización</label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="codigoInvitacion"
                  name="codigoInvitacion"
                  placeholder="EJ: BOSQUE2026 o UNILASALLISTA"
                  required
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base font-mono uppercase tracking-wider text-blue-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            @if (errorMensaje()) {
              <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ errorMensaje() }}</span>
              </div>
            }

            @if (exitoMensaje()) {
              <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{{ exitoMensaje() }}</span>
              </div>
            }

            <button
              type="submit"
              [disabled]="cargando() || !codigoInvitacion.trim()"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              @if (cargando()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Validando código...</span>
              } @else {
                <span>Unirme ahora</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              }
            </button>
          </form>

          <!-- Help section (Slide 5 wireframe) -->
          <div class="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">¿Necesitas Ayuda?</h4>
            <div class="text-xs text-slate-400 space-y-2">
              <p>• <strong>¿Dónde encuentro un código?</strong> Consulta con el administrador de servicios de tu conjunto residencial, empresa o centro comercial.</p>
              <p>• <strong>Acceso Seguro:</strong> Los códigos de invitación son únicos y garantizan que solo miembros autorizados accedan al mapa de casillas.</p>
            </div>
          </div>
        </div>

        <!-- Explanatory card (Right) (Slide 5 wireframe) -->
        <div class="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 overflow-hidden relative shadow-xl">
          <div class="rounded-xl overflow-hidden mb-5 border border-slate-800 bg-slate-800/50 aspect-video flex items-center justify-center relative">
            <div class="absolute inset-0 bg-blue-900/20 backdrop-blur-[1px]"></div>
            <div class="text-center p-4 relative z-10">
              <div class="w-12 h-12 mx-auto rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mb-2 text-blue-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase text-blue-300 tracking-wider">Acceso Mediante Código</span>
              <p class="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto">
                Solo quienes reciben una invitación pueden ingresar al sistema del parqueadero.
              </p>
            </div>
          </div>

          <div class="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
            Cada código de invitación es asignado y validado en tiempo real. Al unirte, tendrás acceso instantáneo para ver casillas libres y gestionar tus reservas desde tu dispositivo.
          </div>
        </div>
      </div>
    </div>
  `
})
export class UnirseCodigoComponent {
  private organizacionService = inject(OrganizacionService);
  private router = inject(Router);

  codigoInvitacion = '';
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  exitoMensaje = signal<string | null>(null);

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
