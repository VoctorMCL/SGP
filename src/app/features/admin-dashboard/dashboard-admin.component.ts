import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CasillaService } from '../../core/services/casilla.service';
import { ReservaService } from '../../core/services/reserva.service';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { Casilla, Organizacion, AlertaReserva } from '../../core/models';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header: Title & Actions (Slide 8 wireframe) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Panel de Administración
            </span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs text-slate-400">WebSocket Activo</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Gestión de Parqueadero Real-Time</h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoriza y gestiona la ocupación de espacios de tu organización en tiempo real.
          </p>
        </div>

        <!-- Sede Switcher & Toolbar -->
        <div class="flex items-center gap-3">
          <select
            [ngModel]="orgSeleccionadaId()"
            (ngModelChange)="cambiarOrganizacion($event)"
            class="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            @for (org of organizaciones(); track org._id) {
              <option [value]="org._id">{{ org.nombre }}</option>
            }
          </select>

          <button
            (click)="cargarDatos()"
            class="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards (Slide 8 wireframe) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Metric 1: Ocupación Total -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ocupación Total</div>
          <div class="text-3xl font-black text-white mt-2">{{ porcentajeOcupacion() }}%</div>
          <div class="text-[11px] text-slate-500 mt-1">{{ ocupadasCount() }} de {{ casillas().length }} puestos</div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-600/30">
            <div class="h-full bg-blue-500" [style.width.%]="porcentajeOcupacion()"></div>
          </div>
        </div>

        <!-- Metric 2: Espacios Libres -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Espacios Libres</div>
          <div class="text-3xl font-black text-emerald-400 mt-2">{{ libresCount() }}</div>
          <div class="text-[11px] text-slate-500 mt-1">Disponibles ahora</div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/20"></div>
        </div>

        <!-- Metric 3: Miembros Activos -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div class="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Usuarios / Miembros</div>
          <div class="text-3xl font-black text-blue-400 mt-2">{{ miembrosCount() }}</div>
          <div class="text-[11px] text-slate-500 mt-1">Registrados en la sede</div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/20"></div>
        </div>

        <!-- Metric 4: Alertas Críticas -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div class="text-[11px] font-bold text-red-400 uppercase tracking-wider">Alertas Tiempo Excedido</div>
          <div class="text-3xl font-black text-red-400 mt-2">{{ alertas().length }}</div>
          <div class="text-[11px] text-slate-500 mt-1">Requieren atención</div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-red-500/30"></div>
        </div>
      </div>

      <!-- Main Layout: Admin Grid (Left) + Activity & Critical Alerts (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Interactive Admin Grid (Slide 8 wireframe) -->
        <div class="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold text-white tracking-tight">Mapa de Puestos (Modo Guardia / Admin)</h2>
              <p class="text-xs text-slate-400">Haz clic sobre cualquier puesto para alternar su estado manualmente.</p>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
              <span class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Libre
              </span>
              <span class="flex items-center gap-1.5 text-red-400">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> Ocupado
              </span>
            </div>
          </div>

          <!-- Notification Banner (Slide 8 wireframe) -->
          <div class="mb-6 p-3.5 bg-blue-950/40 border border-blue-900/40 rounded-xl text-xs text-blue-300 flex items-center gap-2.5">
            <svg class="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Los cambios realizados en este mapa se sincronizan instantáneamente con la aplicación móvil del conductor. Ten precaución al modificar estados activos.</span>
          </div>

          @if (mensajeFeedback()) {
            <div class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
              {{ mensajeFeedback() }}
            </div>
          }

          <!-- Spots Grid -->
          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
            @for (casilla of casillas(); track casilla._id) {
              <button
                type="button"
                (click)="toggleEstadoCasilla(casilla)"
                [disabled]="cargandoCasillaId() === casilla._id"
                [class.bg-emerald-950_50]="casilla.estado === 'libre'"
                [class.border-emerald-600_60]="casilla.estado === 'libre'"
                [class.text-emerald-300]="casilla.estado === 'libre'"
                [class.hover:border-emerald-400]="casilla.estado === 'libre'"
                [class.bg-red-950_50]="casilla.estado === 'ocupado'"
                [class.border-red-600_60]="casilla.estado === 'ocupado'"
                [class.text-red-400]="casilla.estado === 'ocupado'"
                [class.hover:border-red-400]="casilla.estado === 'ocupado'"
                class="h-16 rounded-2xl border flex flex-col items-center justify-center p-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm group relative"
              >
                @if (cargandoCasillaId() === casilla._id) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                } @else {
                  <span class="text-xs font-black tracking-tight">{{ casilla.codigo }}</span>
                  <span class="text-[9px] uppercase font-semibold mt-0.5">
                    {{ casilla.estado }}
                  </span>
                  @if (casilla.tipo === 'discapacitados') {
                    <span class="text-[9px]">♿</span>
                  } @else if (casilla.tipo === 'electrico') {
                    <span class="text-[9px]">⚡</span>
                  }
                }
              </button>
            }
          </div>
        </div>

        <!-- Right Side: Recent Activity & Critical Alerts (Slide 8 wireframe) -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Critical Alerts Card (Slide 8 wireframe) -->
          <div class="bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <h3 class="text-sm font-bold text-red-400 uppercase tracking-wider">Alertas Críticas</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300">
                {{ alertas().length }} activas
              </span>
            </div>

            <p class="text-xs text-slate-400 mb-4 leading-relaxed">
              Vehículos que han excedido su tiempo de reserva pactado en la zona horaria del estacionamiento.
            </p>

            @if (alertas().length === 0) {
              <div class="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                No hay vehículos con tiempo excedido en este momento.
              </div>
            } @else {
              <div class="space-y-3">
                @for (alerta of alertas(); track alerta._id) {
                  <div class="p-3.5 bg-slate-950 border border-red-900/40 rounded-2xl flex flex-col justify-between gap-2.5">
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white">
                          Puesto {{ alerta.casilla?.codigo }}
                        </span>
                        <span class="text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                          Excedido
                        </span>
                      </div>
                      <div class="text-xs text-slate-300 mt-1">
                        Placa: <span class="font-mono font-bold text-blue-400">{{ alerta.placa }}</span>
                      </div>
                      <div class="text-[11px] text-slate-500">
                        Usuario: {{ alerta.usuario?.nombre }} {{ alerta.usuario?.apellido }} ({{ alerta.usuario?.telefono }})
                      </div>
                    </div>

                    <button
                      type="button"
                      (click)="finalizarReservaEnAlerta(alerta._id)"
                      class="w-full py-1.5 px-3 bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:border-transparent text-red-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Liberar Puesto y Finalizar</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Recent Activity Card (Slide 8 wireframe) -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-white tracking-tight">Actividad Reciente</h3>
              <span class="text-[11px] text-slate-400 font-medium">En vivo</span>
            </div>

            <div class="space-y-3">
              @for (act of feedActividad(); track act.id) {
                <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                      {{ act.usuario.charAt(0) }}
                    </div>
                    <div>
                      <span class="text-slate-200 font-semibold block">{{ act.usuario }}</span>
                      <span class="text-[11px] text-slate-400">{{ act.accion }} Puesto {{ act.puesto }}</span>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono">{{ act.tiempo }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  `
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  private organizacionService = inject(OrganizacionService);
  private casillaService = inject(CasillaService);
  private reservaService = inject(ReservaService);
  private socketService = inject(SocketService);
  authService = inject(AuthService);

  organizaciones = signal<Organizacion[]>([]);
  orgSeleccionadaId = signal<string>('');
  casillas = signal<Casilla[]>([]);
  alertas = signal<AlertaReserva[]>([]);
  miembrosCount = signal<number>(0);

  cargandoCasillaId = signal<string | null>(null);
  mensajeFeedback = signal<string | null>(null);

  feedActividad = signal<Array<{ id: string; usuario: string; puesto: string; accion: string; tiempo: string }>>([
    { id: '1', usuario: 'Roberto Gómez', puesto: 'A3', accion: 'Reservó', tiempo: 'Hace 3 min' },
    { id: '2', usuario: 'Sara Torres', puesto: 'B1', accion: 'Desocupó', tiempo: 'Hace 12 min' },
    { id: '3', usuario: 'Mario Silva', puesto: 'C1', accion: 'Ocupó', tiempo: 'Hace 25 min' },
    { id: '4', usuario: 'Cristina Méndez', puesto: 'A6', accion: 'Reservó', tiempo: 'Hace 1 hora' }
  ]);

  private subs = new Subscription();

  libresCount = computed(() => this.casillas().filter(c => c.estado === 'libre').length);
  ocupadasCount = computed(() => this.casillas().filter(c => c.estado === 'ocupado').length);
  porcentajeOcupacion = computed(() => {
    const total = this.casillas().length;
    if (!total) return 0;
    return Math.round((this.ocupadasCount() / total) * 100);
  });

  ngOnInit(): void {
    this.organizacionService.misOrganizaciones().subscribe(orgs => {
      this.organizaciones.set(orgs);
      if (orgs.length > 0) {
        this.orgSeleccionadaId.set(orgs[0]._id);
        this.cambiarOrganizacion(orgs[0]._id);
      }
    });

    this.subs.add(
      this.socketService.onCasillaActualizada().subscribe(casillaAct => {
        this.casillas.update(lista =>
          lista.map(c => (c._id === casillaAct._id ? { ...c, estado: casillaAct.estado } : c))
        );

        this.feedActividad.update(act => [
          {
            id: Date.now().toString(),
            usuario: 'Operador / Conductor',
            puesto: casillaAct.codigo,
            accion: casillaAct.estado === 'ocupado' ? 'Ocupó' : 'Liberó',
            tiempo: 'Justo ahora'
          },
          ...act.slice(0, 5)
        ]);

        this.cargarAlertas();
      })
    );
  }

  ngOnDestroy(): void {
    if (this.orgSeleccionadaId()) {
      this.socketService.salirOrganizacion(this.orgSeleccionadaId());
    }
    this.subs.unsubscribe();
  }

  cambiarOrganizacion(id: string): void {
    if (this.orgSeleccionadaId()) {
      this.socketService.salirOrganizacion(this.orgSeleccionadaId());
    }
    this.orgSeleccionadaId.set(id);
    this.socketService.unirseOrganizacion(id);
    this.cargarDatos();
  }

  cargarDatos(): void {
    const id = this.orgSeleccionadaId();
    if (!id) return;

    this.casillaService.listarPorOrganizacion(id).subscribe({
      next: (data) => this.casillas.set(data),
      error: (err) => console.error('Error cargando casillas:', err)
    });

    this.cargarAlertas();

    this.organizacionService.listarMiembros(id).subscribe({
      next: (m) => this.miembrosCount.set(m.length),
      error: () => this.miembrosCount.set(0)
    });
  }

  cargarAlertas(): void {
    const id = this.orgSeleccionadaId();
    if (!id) return;
    this.reservaService.alertasOrganizacion(id).subscribe({
      next: (data) => this.alertas.set(data),
      error: (err) => console.error('Error cargando alertas:', err)
    });
  }

  toggleEstadoCasilla(casilla: Casilla): void {
    const nuevoEstado = casilla.estado === 'libre' ? 'ocupado' : 'libre';
    this.cargandoCasillaId.set(casilla._id);
    this.mensajeFeedback.set(null);

    this.casillaService.cambiarEstado(casilla._id, nuevoEstado).subscribe({
      next: () => {
        this.cargandoCasillaId.set(null);
        this.mensajeFeedback.set(`Puesto ${casilla.codigo} cambiado a ${nuevoEstado}. Sincronizado en tiempo real.`);
        this.cargarDatos();
      },
      error: (err) => {
        this.cargandoCasillaId.set(null);
        this.mensajeFeedback.set(err.error?.message || 'Error al cambiar estado de la casilla.');
      }
    });
  }

  finalizarReservaEnAlerta(reservaId: string): void {
    this.reservaService.finalizarReserva(reservaId).subscribe({
      next: () => {
        this.mensajeFeedback.set('Reserva finalizada y puesto liberado correctamente.');
        this.cargarDatos();
      },
      error: (err) => {
        this.mensajeFeedback.set(err.error?.message || 'Error al finalizar reserva.');
      }
    });
  }
}
