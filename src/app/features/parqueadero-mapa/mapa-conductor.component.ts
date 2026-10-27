import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CasillaService } from '../../core/services/casilla.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ReservaService } from '../../core/services/reserva.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { Casilla, Organizacion, Reserva } from '../../core/models';

@Component({
  selector: 'app-mapa-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Top Breadcrumb & Switcher -->
      <div class="flex items-center justify-between mb-4 text-xs text-slate-400">
        <a routerLink="/organizaciones" class="hover:text-white flex items-center gap-1.5 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Ver todas tus sedes
        </a>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-slate-300 font-medium">Sincronización en Vivo (WebSockets)</span>
        </div>
      </div>

      <!-- Header: Org Info (Slide 7) -->
      @if (organizacion()) {
        <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-extrabold text-white tracking-tight">{{ organizacion()?.nombre }}</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {{ organizacion()?.tipoEntidad }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
              Visualización en tiempo real de la disponibilidad a través de un mapa interactivo.
            </p>
          </div>

          <!-- Quick Badges -->
          <div class="flex items-center gap-2.5">
            <div class="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              {{ libresCount() }} Libres
            </div>
            <div class="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-400"></span>
              {{ ocupadasCount() }} Ocupadas
            </div>
          </div>
        </div>
      }

      <!-- Search & Filters Toolbar (Slide 7) -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-[240px]">
          <div class="relative w-full max-w-xs">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.3-4.3"></path>
              </svg>
            </span>
            <input
              type="text"
              [(ngModel)]="busqueda"
              placeholder="Buscar espacio (ej. A1, B3)..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Filter buttons -->
          <div class="flex items-center gap-1.5 text-xs">
            <button
              (click)="filtroTipo.set('todos')"
              [class.bg-blue-600]="filtroTipo() === 'todos'"
              [class.text-white]="filtroTipo() === 'todos'"
              [class.text-slate-400]="filtroTipo() !== 'todos'"
              class="px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Todos
            </button>
            <button
              (click)="filtroTipo.set('libre')"
              [class.bg-emerald-600]="filtroTipo() === 'libre'"
              [class.text-white]="filtroTipo() === 'libre'"
              [class.text-slate-400]="filtroTipo() !== 'libre'"
              class="px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Libres
            </button>
            <button
              (click)="filtroTipo.set('discapacitados')"
              [class.bg-blue-600]="filtroTipo() === 'discapacitados'"
              [class.text-white]="filtroTipo() === 'discapacitados'"
              [class.text-slate-400]="filtroTipo() !== 'discapacitados'"
              class="px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              ♿ Discapacitados
            </button>
            <button
              (click)="filtroTipo.set('electrico')"
              [class.bg-blue-600]="filtroTipo() === 'electrico'"
              [class.text-white]="filtroTipo() === 'electrico'"
              [class.text-slate-400]="filtroTipo() !== 'electrico'"
              class="px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              ⚡ Eléctrico
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Switcher entre vista Plano y vista Cuadrícula -->
          <div class="flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              (click)="vistaModo.set('plano')"
              [class.bg-blue-600]="vistaModo() === 'plano'"
              [class.text-white]="vistaModo() === 'plano'"
              [class.text-slate-400]="vistaModo() !== 'plano'"
              class="px-2.5 py-1 rounded-lg font-semibold transition-all"
            >
              Plano Espacial
            </button>
            <button
              (click)="vistaModo.set('secciones')"
              [class.bg-blue-600]="vistaModo() === 'secciones'"
              [class.text-white]="vistaModo() === 'secciones'"
              [class.text-slate-400]="vistaModo() !== 'secciones'"
              class="px-2.5 py-1 rounded-lg font-semibold transition-all"
            >
              Por Secciones
            </button>
          </div>

          @if (authService.userRole() === 'administrador') {
            <a
              [routerLink]="['/organizaciones', organizacionId(), 'disenador']"
              class="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-xl border border-blue-500/30 text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>🎨 Diseñar Plano</span>
            </a>
          }

          <button
            (click)="cargarCasillas()"
            title="Recargar estado manual"
            class="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-xs flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      <!-- Main Layout: Parking Map Grid (Left) + Detail & Reserve Drawer (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Interactive Parking Lot Map (Slide 7) -->
        <div class="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          @if (vistaModo() === 'plano') {
            <!-- Vista Plano Diseñado (Espacial) -->
            <div class="w-full h-[560px] bg-slate-950/90 rounded-2xl border border-dashed border-slate-800 relative overflow-auto select-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] p-4">
              @if (casillasFiltradas().length === 0) {
                <div class="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>No hay elementos para mostrar.</p>
                </div>
              }
              @for (c of casillasFiltradas(); track c._id) {
                <button
                  type="button"
                  (click)="seleccionarCasilla(c)"
                  [style.left.px]="c.posX || 20"
                  [style.top.px]="c.posY || 20"
                  [style.transform]="'rotate(' + (c.rotacion || 0) + 'deg)'"
                  [class.ring-2]="casillaSeleccionada()?._id === c._id"
                  [class.ring-blue-400]="casillaSeleccionada()?._id === c._id"
                  [class.bg-emerald-950_80]="c.estado === 'libre' && c.tipo !== 'carril' && c.tipo !== 'entrada' && c.tipo !== 'salida'"
                  [class.border-emerald-500_60]="c.estado === 'libre' && c.tipo !== 'carril' && c.tipo !== 'entrada' && c.tipo !== 'salida'"
                  [class.text-emerald-300]="c.estado === 'libre' && c.tipo !== 'carril'"
                  [class.bg-red-950_80]="c.estado === 'ocupado' && c.tipo !== 'carril' && c.tipo !== 'entrada' && c.tipo !== 'salida'"
                  [class.border-red-500_60]="c.estado === 'ocupado' && c.tipo !== 'carril' && c.tipo !== 'entrada' && c.tipo !== 'salida'"
                  [class.text-red-400]="c.estado === 'ocupado'"
                  [class.bg-emerald-900_90]="c.tipo === 'entrada'"
                  [class.border-emerald-400]="c.tipo === 'entrada'"
                  [class.text-emerald-100]="c.tipo === 'entrada'"
                  [class.bg-rose-900_90]="c.tipo === 'salida'"
                  [class.border-rose-400]="c.tipo === 'salida'"
                  [class.text-rose-100]="c.tipo === 'salida'"
                  [class.bg-slate-800]="c.tipo === 'carril'"
                  [class.border-slate-600]="c.tipo === 'carril'"
                  [class.text-slate-300]="c.tipo === 'carril'"
                  class="absolute rounded-xl border flex flex-col items-center justify-center p-1.5 shadow-lg transition-transform hover:scale-105"
                  [style.width.px]="c.tipo === 'carril' ? 180 : 80"
                  [style.height.px]="c.tipo === 'carril' ? 50 : 70"
                >
                  @if (c.tipo === 'entrada') {
                    <span class="text-xs">🚗 ⬇</span>
                    <span class="text-[9px] font-bold uppercase tracking-wider">{{ c.codigo }}</span>
                  } @else if (c.tipo === 'salida') {
                    <span class="text-xs">🚪 ⬆</span>
                    <span class="text-[9px] font-bold uppercase tracking-wider">{{ c.codigo }}</span>
                  } @else if (c.tipo === 'carril') {
                    <span class="text-[10px] font-mono tracking-widest uppercase">═ VÍA CIRCULACIÓN ═</span>
                  } @else {
                    <div class="flex items-center gap-1">
                      @if (c.tipo === 'discapacitados') { <span>♿</span> }
                      @if (c.tipo === 'electrico') { <span>⚡</span> }
                      <span class="text-xs font-black">{{ c.codigo }}</span>
                    </div>
                    <span class="text-[8px] uppercase font-bold tracking-wider mt-0.5">
                      {{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }}
                    </span>
                  }
                </button>
              }
            </div>
          } @else {
            <!-- Parking lanes and spots grouped by sections -->
            <div class="space-y-8">
              <!-- Upper Level: Sección A & Sección B -->
              <div>
                <div class="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 px-1">
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span> Sección A (Norte)
                  </span>
                  <span class="text-[11px] text-slate-500">Acceso Elevador / Peatonal</span>
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span> Sección B (Norte)
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <!-- Grid Sección A -->
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                    @for (c of casillasPorSeccion('Sección A'); track c._id) {
                      <button
                        type="button"
                        (click)="seleccionarCasilla(c)"
                        [class.ring-2]="casillaSeleccionada()?._id === c._id"
                        [class.ring-blue-400]="casillaSeleccionada()?._id === c._id"
                        [class.bg-emerald-950_50]="c.estado === 'libre'"
                        [class.border-emerald-600_60]="c.estado === 'libre'"
                        [class.text-emerald-300]="c.estado === 'libre'"
                        [class.bg-red-950_40]="c.estado === 'ocupado'"
                        [class.border-red-600_60]="c.estado === 'ocupado'"
                        [class.text-red-400]="c.estado === 'ocupado'"
                        class="h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition-all hover:scale-105 active:scale-95 relative"
                      >
                        <span class="text-xs font-black">{{ c.codigo }}</span>
                        <span class="text-[9px] uppercase font-semibold">
                          @if (c.tipo === 'discapacitados') { ♿ }
                          @else if (c.tipo === 'electrico') { ⚡ }
                          @else { {{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }} }
                        </span>
                      </button>
                    }
                  </div>

                  <!-- Grid Sección B -->
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                    @for (c of casillasPorSeccion('Sección B'); track c._id) {
                      <button
                        type="button"
                        (click)="seleccionarCasilla(c)"
                        [class.ring-2]="casillaSeleccionada()?._id === c._id"
                        [class.ring-blue-400]="casillaSeleccionada()?._id === c._id"
                        [class.bg-emerald-950_50]="c.estado === 'libre'"
                        [class.border-emerald-600_60]="c.estado === 'libre'"
                        [class.text-emerald-300]="c.estado === 'libre'"
                        [class.bg-red-950_40]="c.estado === 'ocupado'"
                        [class.border-red-600_60]="c.estado === 'ocupado'"
                        [class.text-red-400]="c.estado === 'ocupado'"
                        class="h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition-all hover:scale-105 active:scale-95 relative"
                      >
                        <span class="text-xs font-black">{{ c.codigo }}</span>
                        <span class="text-[9px] uppercase font-semibold">
                          @if (c.tipo === 'discapacitados') { ♿ }
                          @else if (c.tipo === 'electrico') { ⚡ }
                          @else { {{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }} }
                        </span>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Central Roadway / Circulation (Slide 7 wireframe: "CIRCULACIÓN PRINCIPAL") -->
              <div class="py-3 px-6 bg-slate-950 border-y border-dashed border-slate-800 rounded-xl flex items-center justify-between text-slate-500 font-mono text-[11px] tracking-widest uppercase">
                <span class="flex items-center gap-2">← ENTRADA VEHICULAR</span>
                <span class="font-bold text-slate-400 tracking-wider">═ CIRCULACIÓN PRINCIPAL ═</span>
                <span class="flex items-center gap-2">SALIDA →</span>
              </div>

              <!-- Lower Level: Sección C & Sección D -->
              <div>
                <div class="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 px-1">
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span> Sección C (Sur)
                  </span>
                  <span class="text-[11px] text-slate-500">Zona Residencial</span>
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Sección D (Sur)
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <!-- Grid Sección C -->
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                    @for (c of casillasPorSeccion('Sección C'); track c._id) {
                      <button
                        type="button"
                        (click)="seleccionarCasilla(c)"
                        [class.ring-2]="casillaSeleccionada()?._id === c._id"
                        [class.ring-blue-400]="casillaSeleccionada()?._id === c._id"
                        [class.bg-emerald-950_50]="c.estado === 'libre'"
                        [class.border-emerald-600_60]="c.estado === 'libre'"
                        [class.text-emerald-300]="c.estado === 'libre'"
                        [class.bg-red-950_40]="c.estado === 'ocupado'"
                        [class.border-red-600_60]="c.estado === 'ocupado'"
                        [class.text-red-400]="c.estado === 'ocupado'"
                        class="h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition-all hover:scale-105 active:scale-95 relative"
                      >
                        <span class="text-xs font-black">{{ c.codigo }}</span>
                        <span class="text-[9px] uppercase font-semibold">
                          @if (c.tipo === 'discapacitados') { ♿ }
                          @else if (c.tipo === 'electrico') { ⚡ }
                          @else { {{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }} }
                        </span>
                      </button>
                    }
                  </div>

                  <!-- Grid Sección D -->
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                    @for (c of casillasPorSeccion('Sección D'); track c._id) {
                      <button
                        type="button"
                        (click)="seleccionarCasilla(c)"
                        [class.ring-2]="casillaSeleccionada()?._id === c._id"
                        [class.ring-blue-400]="casillaSeleccionada()?._id === c._id"
                        [class.bg-emerald-950_50]="c.estado === 'libre'"
                        [class.border-emerald-600_60]="c.estado === 'libre'"
                        [class.text-emerald-300]="c.estado === 'libre'"
                        [class.bg-red-950_40]="c.estado === 'ocupado'"
                        [class.border-red-600_60]="c.estado === 'ocupado'"
                        [class.text-red-400]="c.estado === 'ocupado'"
                        class="h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition-all hover:scale-105 active:scale-95 relative"
                      >
                        <span class="text-xs font-black">{{ c.codigo }}</span>
                        <span class="text-[9px] uppercase font-semibold">
                          @if (c.tipo === 'discapacitados') { ♿ }
                          @else if (c.tipo === 'electrico') { ⚡ }
                          @else { {{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }} }
                        </span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Bottom Sensor Status Footer (Slide 7 wireframe) -->
          <div class="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span><strong>Estado del Sistema:</strong> Sensores y Socket.io operando normalmente. Sincronización continua de casillas.</span>
            </div>
            <span class="text-[11px] font-mono text-slate-500">Latencia: &lt; 50ms</span>
          </div>
        </div>

        <!-- Spot Detail & Reservation Side Drawer (Slide 7 wireframe) -->
        <div class="lg:col-span-4 space-y-6">
          @if (casillaSeleccionada(); as sel) {
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs uppercase font-bold tracking-wider text-slate-400">Puesto Seleccionado</span>
                <span
                  [class.bg-emerald-500_10]="sel.estado === 'libre'"
                  [class.text-emerald-400]="sel.estado === 'libre'"
                  [class.border-emerald-500_30]="sel.estado === 'libre'"
                  [class.bg-red-500_10]="sel.estado === 'ocupado'"
                  [class.text-red-400]="sel.estado === 'ocupado'"
                  [class.border-red-500_30]="sel.estado === 'ocupado'"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold border"
                >
                  {{ sel.estado === 'libre' ? 'Espacio Libre' : 'Ocupado' }}
                </span>
              </div>

              <!-- Giant Code Box (Slide 7 wireframe) -->
              <div class="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center my-4">
                <div class="text-5xl font-black text-white tracking-tight">{{ sel.codigo }}</div>
                <div class="text-xs text-slate-400 mt-1 font-mono uppercase">{{ sel.seccion }} • Tipo: {{ sel.tipo }}</div>
              </div>

              <div class="space-y-3 text-xs mb-6">
                <div class="flex items-center justify-between py-2 border-b border-slate-800 text-slate-400">
                  <span>Tipo de espacio</span>
                  <span class="text-slate-200 font-semibold capitalize">{{ sel.tipo }}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-800 text-slate-400">
                  <span>Disponibilidad</span>
                  <span class="text-slate-200 font-semibold">{{ sel.estado === 'libre' ? 'Inmediata' : 'En uso' }}</span>
                </div>
              </div>

              @if (mensajeAccion()) {
                <div class="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs">
                  {{ mensajeAccion() }}
                </div>
              }

              <!-- Reservation Form (If libre) -->
              @if (sel.estado === 'libre') {
                <div class="space-y-3.5 pt-2">
                  <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Reservar este puesto:</h4>
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-400 mb-1">Placa del Vehículo</label>
                    <input
                      type="text"
                      [(ngModel)]="placaReserva"
                      placeholder="Ej. ABC-123"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-400 mb-1">Duración de la reserva (Horas)</label>
                    <select
                      [(ngModel)]="duracionHoras"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option [ngValue]="1">1 Hora</option>
                      <option [ngValue]="2">2 Horas</option>
                      <option [ngValue]="3">3 Horas</option>
                      <option [ngValue]="4">4 Horas</option>
                      <option [ngValue]="8">8 Horas (Jornada)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    (click)="reservarCasilla(sel)"
                    [disabled]="cargandoAccion() || !placaReserva.trim()"
                    class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    @if (cargandoAccion()) {
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Procesando reserva...</span>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Marcar como ocupado / Reservar</span>
                    }
                  </button>
                </div>
              } @else {
                <!-- State is ocupado -->
                @if (miReservaEnCasilla(sel); as res) {
                  <div class="pt-2">
                    <p class="text-xs text-amber-400 mb-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      Tienes una reserva activa en este puesto (Placa: <strong>{{ res.placa }}</strong>).
                    </p>
                    <button
                      type="button"
                      (click)="finalizarMiReserva(res._id)"
                      [disabled]="cargandoAccion()"
                      class="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition-all"
                    >
                      Finalizar mi Reserva (Liberar Puesto)
                    </button>
                  </div>
                } @else {
                  <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                    Este puesto está ocupado actualmente por otro vehículo.
                  </div>
                }
              }
            </div>
          } @else {
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                </svg>
              </div>
              <h4 class="text-sm font-bold text-white">Selecciona una casilla</h4>
              <p class="text-xs text-slate-500 mt-1">Haz clic sobre cualquier puesto del mapa para ver detalles y reservarlo.</p>
            </div>
          }

          <!-- Parking KPI Summary Card (Slide 7 wireframe) -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Información del Estacionamiento</h4>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-slate-300">Ocupación Total</span>
              <span class="text-lg font-black text-white">{{ porcentajeOcupacion() }}%</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                [style.width.%]="porcentajeOcupacion()"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
})
export class MapaConductorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private casillaService = inject(CasillaService);
  private organizacionService = inject(OrganizacionService);
  private reservaService = inject(ReservaService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);

  organizacionId = signal<string>('');
  organizacion = signal<Organizacion | null>(null);
  casillas = signal<Casilla[]>([]);
  misReservas = signal<Reserva[]>([]);
  casillaSeleccionada = signal<Casilla | null>(null);

  busqueda = '';
  filtroTipo = signal<'todos' | 'libre' | 'discapacitados' | 'electrico'>('todos');
  vistaModo = signal<'plano' | 'secciones'>('plano');

  casillasFiltradas = computed(() => {
    let lista = this.casillas();
    if (this.busqueda.trim()) {
      lista = lista.filter(c => c.codigo.toLowerCase().includes(this.busqueda.trim().toLowerCase()));
    }
    if (this.filtroTipo() === 'libre') {
      lista = lista.filter(c => c.estado === 'libre');
    } else if (this.filtroTipo() === 'discapacitados') {
      lista = lista.filter(c => c.tipo === 'discapacitados');
    } else if (this.filtroTipo() === 'electrico') {
      lista = lista.filter(c => c.tipo === 'electrico');
    }
    return lista;
  });

  placaReserva = '';
  duracionHoras = 2;
  cargandoAccion = signal<boolean>(false);
  mensajeAccion = signal<string | null>(null);

  private subs = new Subscription();

  libresCount = computed(() => this.casillas().filter(c => c.estado === 'libre').length);
  ocupadasCount = computed(() => this.casillas().filter(c => c.estado === 'ocupado').length);
  porcentajeOcupacion = computed(() => {
    const total = this.casillas().length;
    if (!total) return 0;
    return Math.round((this.ocupadasCount() / total) * 100);
  });

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      this.organizacionId.set(orgId);
      this.cargarOrganizacion(orgId);
      this.cargarCasillas();
      this.cargarMisReservas();

      this.socketService.unirseOrganizacion(orgId);

      this.subs.add(
        this.socketService.onCasillaActualizada().subscribe(casillaAct => {
          this.casillas.update(lista =>
            lista.map(c => (c._id === casillaAct._id ? { ...c, estado: casillaAct.estado } : c))
          );
          if (this.casillaSeleccionada()?._id === casillaAct._id) {
            this.casillaSeleccionada.set(casillaAct);
          }
        })
      );

      this.subs.add(
        this.socketService.onReservaCreada().subscribe(() => {
          this.cargarMisReservas();
        })
      );

      this.subs.add(
        this.socketService.onReservaFinalizada().subscribe(() => {
          this.cargarMisReservas();
        })
      );
    }

    const usuario = this.authService.currentUser();
    if (usuario && usuario.placas && usuario.placas.length > 0) {
      this.placaReserva = usuario.placas[0];
    }
  }

  ngOnDestroy(): void {
    if (this.organizacionId()) {
      this.socketService.salirOrganizacion(this.organizacionId());
    }
    this.subs.unsubscribe();
  }

  cargarOrganizacion(id: string): void {
    this.organizacionService.misOrganizaciones().subscribe(orgs => {
      const match = orgs.find(o => o._id === id);
      if (match) this.organizacion.set(match);
    });
  }

  cargarCasillas(): void {
    this.casillaService.listarPorOrganizacion(this.organizacionId()).subscribe({
      next: (data) => {
        this.casillas.set(data);
      },
      error: (err) => console.error('Error al cargar casillas:', err)
    });
  }

  cargarMisReservas(): void {
    this.reservaService.misReservas().subscribe({
      next: (data) => {
        this.misReservas.set(data.filter(r => r.estado === 'activa'));
      },
      error: (err) => console.error('Error al cargar reservas:', err)
    });
  }

  casillasPorSeccion(seccionNombre: string): Casilla[] {
    let lista = this.casillas().filter(c => c.seccion.toLowerCase() === seccionNombre.toLowerCase());

    if (this.busqueda.trim()) {
      lista = lista.filter(c => c.codigo.toLowerCase().includes(this.busqueda.trim().toLowerCase()));
    }

    if (this.filtroTipo() === 'libre') {
      lista = lista.filter(c => c.estado === 'libre');
    } else if (this.filtroTipo() === 'discapacitados') {
      lista = lista.filter(c => c.tipo === 'discapacitados');
    } else if (this.filtroTipo() === 'electrico') {
      lista = lista.filter(c => c.tipo === 'electrico');
    }

    return lista;
  }

  seleccionarCasilla(c: Casilla): void {
    this.casillaSeleccionada.set(c);
    this.mensajeAccion.set(null);
  }

  miReservaEnCasilla(c: Casilla): Reserva | undefined {
    return this.misReservas().find(r => {
      const cId = typeof r.casilla === 'object' ? r.casilla._id : r.casilla;
      return cId === c._id;
    });
  }

  reservarCasilla(casilla: Casilla): void {
    if (!this.placaReserva.trim()) return;

    this.cargandoAccion.set(true);
    this.mensajeAccion.set(null);

    this.reservaService.crearReserva({
      casilla: casilla._id,
      placa: this.placaReserva.trim().toUpperCase(),
      duracionHoras: Number(this.duracionHoras)
    }).subscribe({
      next: () => {
        this.cargandoAccion.set(false);
        this.mensajeAccion.set(`¡Casilla ${casilla.codigo} reservada con éxito!`);
        this.cargarCasillas();
        this.cargarMisReservas();
      },
      error: (err) => {
        this.cargandoAccion.set(false);
        this.mensajeAccion.set(err.error?.message || 'Error al reservar la casilla.');
      }
    });
  }

  finalizarMiReserva(reservaId: string): void {
    this.cargandoAccion.set(true);
    this.reservaService.finalizarReserva(reservaId).subscribe({
      next: () => {
        this.cargandoAccion.set(false);
        this.mensajeAccion.set('Reserva finalizada y puesto liberado.');
        this.cargarCasillas();
        this.cargarMisReservas();
      },
      error: (err) => {
        this.cargandoAccion.set(false);
        this.mensajeAccion.set(err.error?.message || 'Error al finalizar reserva.');
      }
    });
  }
}
