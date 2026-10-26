import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-colors">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Brand Logo -->
        <a routerLink="/organizaciones" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v7"></path>
              <path d="M12 15v7"></path>
              <path d="m4.93 4.93 4.95 4.95"></path>
              <path d="m14.12 14.12 4.95 4.95"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-xl tracking-tight text-white">SGP</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">v1.0</span>
            </div>
            <p class="text-[11px] text-slate-400 font-medium hidden sm:block">Gestión de Parqueo Inteligente</p>
          </div>
        </a>

        <!-- Search Bar (As seen in wireframe) -->
        <div class="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div class="relative w-full">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.3-4.3"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="¿Dónde necesitas estacionar?"
              class="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- User profile & Navigation -->
        <div class="flex items-center gap-3">
          @if (authService.currentUser(); as user) {
            <!-- Admin shortcut -->
            @if (user.rol === 'administrador' || user.rol === 'guardia') {
              <a
                routerLink="/admin"
                class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Panel Control
              </a>
            }

            <a
              routerLink="/organizaciones"
              class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors hidden sm:block"
            >
              Mis Sedes
            </a>

            <!-- User Chip -->
            <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow">
                {{ user.nombre.charAt(0) }}{{ user.apellido.charAt(0) }}
              </div>
              <div class="hidden lg:block text-left">
                <p class="text-xs font-semibold text-slate-200 leading-tight">{{ user.nombre }} {{ user.apellido }}</p>
                <span class="inline-block text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {{ user.rol }}
                </span>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              (click)="authService.logout()"
              title="Cerrar sesión"
              class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          } @else {
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-colors"
            >
              Iniciar Sesión
            </a>
          }
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
}
