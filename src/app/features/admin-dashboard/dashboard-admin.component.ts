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

    <main class="mx-auto max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8">
      <!-- Estado superior -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
        <span class="kicker">Consola / Operación</span>
        <div class="flex flex-wrap items-center gap-4 text-[0.6rem] text-mist">
          <span class="flex items-center gap-1.5">
            <span class="live-dot scale-75"></span>
            WebSocket · sincronización en vivo
          </span>
          <span class="mono hidden uppercase tracking-[0.14em] text-mist/40 sm:inline">{{ hoy }}</span>
        </div>
      </div>

      <!-- Encabezado -->
      <div class="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div class="min-w-0 rise">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-3xl font-semibold tracking-[-0.04em] text-chalk sm:text-4xl">Sala de control</h1>
            @if (organizacionActual(); as org) {
              <span class="tag tag-flow">{{ org.tipoEntidad }}</span>
              <span class="tag" [ngClass]="org.acceso24_7 ? 'tag-ok' : 'tag-warn'">{{ org.acceso24_7 ? '24/7' : 'Diurno' }}</span>
            }
          </div>
          <p class="mt-2 max-w-2xl text-[0.72rem] leading-relaxed text-mist">
            {{ organizacionActual()?.direccion || 'Monitorea la ocupación, libera puestos y atiende las reservas excedidas en tiempo real.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 rise-2">
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-mist/60">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 21h3M9 7h3M9 11h3M9 21v-5h3v5"></path>
              </svg>
            </span>
            <select
              [ngModel]="orgSeleccionadaId()"
              (ngModelChange)="cambiarOrganizacion($event)"
              class="field h-9 max-w-[16rem] pl-8 pr-8 text-[0.7rem] font-medium"
              aria-label="Seleccionar sede"
            >
              @for (org of organizaciones(); track org._id) {
                <option [value]="org._id">{{ org.nombre }}</option>
              }
            </select>
          </div>

          @if (authService.userRole() === 'administrador') {
            <a
              [routerLink]="['/organizaciones', orgSeleccionadaId(), 'disenador']"
              class="btn btn-ghost h-9"
              title="Abrir el editor de planos"
            >
              <svg class="h-3.5 w-3.5 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              <span class="hidden sm:inline">Diseñar plano</span>
            </a>
          }

          <button type="button" (click)="cargarDatos()" [disabled]="cargandoCasillas()" class="btn btn-ghost h-9" title="Sincronizar ahora">
            <svg class="h-3.5 w-3.5" [class.animate-spin]="cargandoCasillas()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"></path>
            </svg>
            <span class="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      @if (mensajeFeedback(); as mensaje) {
        <div class="mt-4 flex items-start justify-between gap-3 rounded-md border border-ok/30 bg-ok/[0.07] p-3 text-[0.7rem] leading-relaxed text-ok">
          <span class="flex items-start gap-2">
            <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
            </svg>
            {{ mensaje }}
          </span>
          <button type="button" (click)="mensajeFeedback.set(null)" class="text-current/70 transition-opacity hover:opacity-100" aria-label="Cerrar aviso">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
      }

      <!-- Indicadores -->
      <div class="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <!-- Ocupación -->
        <article class="panel relative overflow-hidden p-4 rise">
          <span class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-signal via-signal/30 to-transparent"></span>
          <div class="flex items-start justify-between gap-2">
            <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Ocupación</span>
            <span class="tag tag-signal">En vivo</span>
          </div>
          <div class="mt-3 flex items-center gap-4">
            <div
              class="relative grid h-14 w-14 shrink-0 place-items-center rounded-full"
              [style.background]="'conic-gradient(#d8ff3e 0 ' + porcentajeOcupacion() + '%, #1b2230 ' + porcentajeOcupacion() + '% 100%)'"
            >
              <div class="grid h-[2.55rem] w-[2.55rem] place-items-center rounded-full bg-panel">
                <span class="mono text-[0.62rem] font-semibold text-chalk">{{ porcentajeOcupacion() }}%</span>
              </div>
            </div>
            <div class="min-w-0">
              <div class="text-3xl font-semibold leading-none tracking-[-0.04em] text-chalk">{{ ocupadasCount() }}</div>
              <div class="mono mt-1 text-[0.5rem] text-mist">de {{ totalPuestos() }} puestos</div>
            </div>
          </div>
          <div class="meter mt-3"><span [style.width.%]="porcentajeOcupacion()"></span></div>
        </article>

        <!-- Libres -->
        <article class="panel relative overflow-hidden p-4 rise-2">
          <span class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-ok via-ok/25 to-transparent"></span>
          <div class="flex items-start justify-between gap-2">
            <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Disponibles</span>
            <span class="h-1.5 w-1.5 rounded-full bg-ok"></span>
          </div>
          <div class="mt-4 flex items-end gap-2">
            <span class="text-3xl font-semibold leading-none tracking-[-0.04em] text-ok">{{ libresCount() }}</span>
            <span class="mono mb-0.5 text-[0.55rem] text-mist">puestos libres</span>
          </div>
          <div class="mt-3 flex items-center gap-1">
            @for (marca of marcasOcupacion(); track $index) {
              <span class="h-1 flex-1 rounded-full" [ngClass]="marca ? 'bg-ok/70' : 'bg-edge'"></span>
            }
          </div>
        </article>

        <!-- Ocupados -->
        <article class="panel relative overflow-hidden p-4 rise-3">
          <span class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-danger/25 to-transparent"></span>
          <div class="flex items-start justify-between gap-2">
            <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">En uso</span>
            <span class="h-1.5 w-1.5 rounded-full bg-danger"></span>
          </div>
          <div class="mt-4 flex items-end gap-2">
            <span class="text-3xl font-semibold leading-none tracking-[-0.04em] text-danger">{{ ocupadasCount() }}</span>
            <span class="mono mb-0.5 text-[0.55rem] text-mist">vehículos</span>
          </div>
          <div class="mono mt-3 flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.1em] text-mist">
            <span class="h-1.5 w-1.5 rounded-full bg-flow"></span>
            {{ miembrosCount() }} miembros en la sede
          </div>
        </article>

        <!-- Alertas -->
        <article class="panel relative overflow-hidden border-danger/30 p-4 rise-4">
          <span class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-danger via-danger/40 to-transparent"></span>
          <div class="flex items-start justify-between gap-2">
            <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-danger">Tiempo excedido</span>
            @if (alertas().length > 0) {
              <span class="live-dot scale-75"></span>
            }
          </div>
          <div class="mt-4 flex items-end gap-2">
            <span class="text-3xl font-semibold leading-none tracking-[-0.04em] text-danger">{{ alertas().length }}</span>
            <span class="mono mb-0.5 text-[0.55rem] text-mist">requieren atención</span>
          </div>
          <div class="mono mt-3 text-[0.5rem] uppercase tracking-[0.1em]" [ngClass]="alertas().length ? 'text-danger' : 'text-ok'">
            {{ alertas().length ? 'Revisar alertas' : 'Sin incidencias' }}
          </div>
        </article>
      </div>

      <!-- Contenido principal -->
      <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <!-- Plano / listado -->
        <section class="panel overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">
                {{ vista() === 'plano' ? 'Plano operativo' : 'Listado de puestos' }}
              </span>
              <span class="tag tag-muted">{{ puestosFiltrados().length }} visibles</span>
            </div>
            <div class="flex items-center overflow-hidden rounded border border-edge">
              <button
                type="button"
                (click)="vista.set('plano')"
                class="px-2.5 py-1.5 text-[0.6rem] font-semibold transition-colors"
                [ngClass]="vista() === 'plano' ? 'bg-signal text-void' : 'text-mist hover:text-chalk'"
              >
                Plano
              </button>
              <button
                type="button"
                (click)="vista.set('lista')"
                class="px-2.5 py-1.5 text-[0.6rem] font-semibold transition-colors"
                [ngClass]="vista() === 'lista' ? 'bg-signal text-void' : 'text-mist hover:text-chalk'"
              >
                Lista
              </button>
            </div>
          </div>

          <!-- Filtros -->
          <div class="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-2.5">
            <div class="relative min-w-[11rem] flex-1 sm:max-w-[15rem]">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-mist/60">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" stroke-width="1.8"></circle>
                  <path stroke-linecap="round" stroke-width="1.8" d="m20 20-3.4-3.4"></path>
                </svg>
              </span>
              <input
                type="text"
                [ngModel]="busqueda()"
                (ngModelChange)="busqueda.set($event)"
                placeholder="Buscar puesto o zona…"
                class="field h-8 pl-8 text-[0.68rem]"
              />
            </div>

            <div class="flex items-center gap-1 rounded-md border border-edge p-0.5">
              <button
                type="button"
                (click)="filtroEstado.set('todos')"
                class="rounded px-2.5 py-1 text-[0.58rem] font-medium transition-colors"
                [ngClass]="filtroEstado() === 'todos' ? 'bg-white/[0.07] text-chalk' : 'text-mist hover:text-chalk'"
              >
                Todos
              </button>
              <button
                type="button"
                (click)="filtroEstado.set('libres')"
                class="flex items-center gap-1.5 rounded px-2.5 py-1 text-[0.58rem] font-medium transition-colors"
                [ngClass]="filtroEstado() === 'libres' ? 'bg-ok/[0.12] text-ok' : 'text-mist hover:text-chalk'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-ok"></span> Libres
              </button>
              <button
                type="button"
                (click)="filtroEstado.set('ocupados')"
                class="flex items-center gap-1.5 rounded px-2.5 py-1 text-[0.58rem] font-medium transition-colors"
                [ngClass]="filtroEstado() === 'ocupados' ? 'bg-danger/[0.12] text-danger' : 'text-mist hover:text-chalk'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-danger"></span> Ocupados
              </button>
            </div>

            <div class="ml-auto flex items-center gap-1.5">
              @if (vista() === 'plano') {
                <div class="flex items-center overflow-hidden rounded border border-edge">
                  <button type="button" (click)="cambiarZoom(-0.1)" class="grid h-7 w-7 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk" title="Alejar">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M5 12h14"></path></svg>
                  </button>
                  <button type="button" (click)="resetZoom()" class="mono h-7 min-w-[2.8rem] border-x border-edge px-1 text-[0.52rem] text-chalk transition-colors hover:bg-white/[0.04]" title="Ajustar zoom">
                    {{ zoomPorcentaje() }}%
                  </button>
                  <button type="button" (click)="cambiarZoom(0.1)" class="grid h-7 w-7 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk" title="Acercar">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14"></path></svg>
                  </button>
                </div>
              }
              <span class="mono hidden items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.1em] text-mist sm:flex">
                <span class="live-dot scale-75"></span>
                {{ cargandoCasillas() ? 'Sincronizando' : 'En línea' }}
              </span>
            </div>
          </div>

          @if (vista() === 'plano') {
            <div class="relative h-[28rem] overflow-auto bg-[#06090e] sm:h-[33rem] xl:h-[36rem]">
              <div class="min-h-full min-w-full p-4">
                <div class="relative shrink-0" [style.width.px]="ANCHO * zoom()" [style.height.px]="ALTO * zoom()">
                  <div
                    class="plan-surface absolute left-0 top-0 origin-top-left"
                    [style.width.px]="ANCHO"
                    [style.height.px]="ALTO"
                    [style.transform]="'scale(' + zoom() + ')'"
                  >
                    <div class="pointer-events-none absolute inset-0 border border-edge-strong/40"></div>
                    <span class="pointer-events-none absolute left-2 top-2 z-10 h-5 w-5 border-l border-t border-signal/35"></span>
                    <span class="pointer-events-none absolute right-2 top-2 z-10 h-5 w-5 border-r border-t border-signal/35"></span>
                    <span class="pointer-events-none absolute bottom-2 left-2 z-10 h-5 w-5 border-b border-l border-signal/35"></span>
                    <span class="pointer-events-none absolute bottom-2 right-2 z-10 h-5 w-5 border-b border-r border-signal/35"></span>
                    <span class="mono pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-[0.5rem] uppercase tracking-[0.24em] text-mist/30">
                      {{ organizacionActual()?.nombre }} · monitoreo
                    </span>

                    @for (c of casillasPlano(); track c._id) {
                      <button
                        type="button"
                        class="bay"
                        [attr.data-tipo]="c.tipo"
                        [attr.data-estado]="esPuesto(c) ? c.estado : null"
                        [class.is-selected]="casillaSeleccionada()?._id === c._id"
                        [class.is-alert]="alertaIds().has(c._id)"
                        [class.is-dimmed]="esPuesto(c) && !esVisible(c)"
                        [disabled]="!esPuesto(c) || cargandoCasillaId() === c._id"
                        [style.left.px]="c.posX || 0"
                        [style.top.px]="c.posY || 0"
                        [style.width.px]="anchoDe(c)"
                        [style.height.px]="altoDe(c)"
                        [style.transform]="'rotate(' + (c.rotacion || 0) + 'deg)'"
                        (click)="alternarCasilla(c)"
                        [title]="esPuesto(c) ? 'Puesto ' + c.codigo + ' · ' + c.estado + ' · clic para alternar' : c.codigo + ' · ' + tipoCorto(c.tipo)"
                      >
                        @switch (c.tipo) {
                          @case ('standard') {
                            <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M5 16v-4.2L6.8 7h10.4L19 11.8V16M4 16h16v3H4zM7 16v2m10-2v2"></path>
                              <path stroke-width="1.3" d="M7 11.5h10"></path>
                            </svg>
                            <span class="bay-code">{{ c.codigo }}</span>
                            <span class="bay-meta">{{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }}</span>
                          }
                          @case ('discapacitados') {
                            <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="11" cy="4.6" r="1.7" stroke-width="1.6"></circle>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M11 8v5.5h5l2 5.5M8 10a4.6 4.6 0 1 0 5.4 7.4"></path>
                            </svg>
                            <span class="bay-code">{{ c.codigo }}</span>
                            <span class="bay-meta">{{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }}</span>
                          }
                          @case ('electrico') {
                            <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="m13 3-8 11h6l-1 7 8-11h-6l1-7Z"></path>
                            </svg>
                            <span class="bay-code">{{ c.codigo }}</span>
                            <span class="bay-meta">{{ c.estado === 'libre' ? 'Libre' : 'Ocupado' }}</span>
                          }
                          @case ('entrada') {
                            <svg class="bay-glyph h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"></path>
                            </svg>
                            <span class="bay-code">{{ c.codigo }}</span>
                            <span class="bay-meta">{{ c.seccion }}</span>
                          }
                          @case ('salida') {
                            <svg class="bay-glyph h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21V9m0 0 4 4M12 9l-4 4M5 3h14"></path>
                            </svg>
                            <span class="bay-code">{{ c.codigo }}</span>
                            <span class="bay-meta">{{ c.seccion }}</span>
                          }
                          @case ('carril') {
                            <span class="bay-lane-line"></span>
                            <div class="relative z-[2] flex w-full items-center justify-between px-3">
                              <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/60">◀</span>
                              <span class="mono text-[0.5rem] uppercase tracking-[0.2em] text-mist/80">Vía de circulación</span>
                              <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/60">▶</span>
                            </div>
                          }
                        }

                        @if (cargandoCasillaId() === c._id) {
                          <span class="absolute inset-0 z-20 grid place-items-center bg-void/65">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-chalk/25 border-t-chalk"></span>
                          </span>
                        }
                      </button>
                    }

                    @if (casillasPlano().length === 0) {
                      <div class="absolute inset-0 flex flex-col items-center justify-center text-center text-mist">
                        <p class="text-xs">No hay puestos que coincidan con el filtro.</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="max-h-[36rem] space-y-3 overflow-auto p-4">
              @for (grupo of seccionesPuestos(); track grupo.nombre) {
                <div class="panel-flat overflow-hidden">
                  <div class="flex items-center justify-between border-b border-edge px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span class="h-1.5 w-1.5 rounded-full bg-flow"></span>
                      <span class="text-[0.7rem] font-semibold text-chalk">{{ grupo.nombre }}</span>
                    </div>
                    <span class="mono text-[0.52rem] text-mist">{{ grupo.libres }}/{{ grupo.total }} libres</span>
                  </div>
                  <div class="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    @for (c of grupo.casillas; track c._id) {
                      <button
                        type="button"
                        class="mini-bay"
                        [attr.data-tipo]="c.tipo"
                        [attr.data-estado]="c.estado"
                        [class.mini-bay-selected]="casillaSeleccionada()?._id === c._id"
                        [class.mini-bay-alert]="alertaIds().has(c._id)"
                        [disabled]="cargandoCasillaId() === c._id"
                        (click)="alternarCasilla(c)"
                        [title]="'Puesto ' + c.codigo + ' · ' + c.estado"
                      >
                        <span class="text-[0.6rem] font-bold leading-none">{{ c.codigo }}</span>
                        <span class="mono mt-0.5 text-[0.4rem] uppercase tracking-[0.08em] opacity-70">
                          {{ c.estado === 'libre' ? 'Libre' : 'Ocup.' }}
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }
              @if (seccionesPuestos().length === 0) {
                <div class="p-10 text-center text-xs text-mist">No hay puestos que coincidan con el filtro.</div>
              }
            </div>
          }

          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-edge px-4 py-2.5">
            <div class="flex flex-wrap items-center gap-3 text-[0.55rem] text-mist">
              <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm border border-ok/50 bg-ok/[0.14]"></span>Libre</span>
              <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm border border-danger/50 bg-danger/[0.14]"></span>Ocupado</span>
              <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm border border-flow/50 bg-flow/[0.14]"></span>Movilidad</span>
              <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm border border-warn/50 bg-warn/[0.14]"></span>Eléctrico</span>
            </div>
            <span class="mono text-[0.5rem] uppercase tracking-[0.1em] text-mist">
              Clic en un puesto para alternar su estado
            </span>
          </div>
        </section>

        <!-- Panel lateral -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          <!-- Alertas -->
          <div class="panel overflow-hidden border-danger/25">
            <div class="flex items-center justify-between border-b border-danger/20 bg-danger/[0.04] px-4 py-3">
              <div class="flex items-center gap-2">
                @if (alertas().length) {
                  <span class="live-dot scale-75"></span>
                }
                <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-danger">Alertas críticas</span>
              </div>
              <span class="tag tag-danger">{{ alertas().length }} activas</span>
            </div>

            <div class="p-3.5">
              <p class="text-[0.62rem] leading-relaxed text-mist">
                Reservas que excedieron su tiempo pactado. Libera el puesto para normalizar la operación.
              </p>

              @if (alertas().length === 0) {
                <div class="mt-3 flex items-start gap-2.5 rounded-md border border-edge bg-white/[0.02] p-3 text-[0.62rem] text-mist">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-ok" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m5 13 4 4 10-10"></path>
                  </svg>
                  Sin vehículos excedidos. La operación está al día.
                </div>
              } @else {
                <div class="mt-3 space-y-2">
                  @for (alerta of alertas(); track alerta._id) {
                    <div class="rounded-md border border-danger/25 bg-danger/[0.045] p-3">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <span class="mono text-[0.7rem] font-semibold text-chalk">Puesto {{ alerta.casilla?.codigo }}</span>
                          <div class="mono mt-1 text-[0.52rem] uppercase tracking-[0.1em] text-danger">
                            {{ alerta.horasExcedidas ? (alerta.horasExcedidas | number:'1.0-1') + ' h excedidas' : 'Tiempo excedido' }}
                          </div>
                        </div>
                        <span class="tag tag-danger">{{ alerta.placa }}</span>
                      </div>
                      <div class="mt-2 flex items-center gap-1.5 text-[0.6rem] text-mist">
                        <svg class="h-3 w-3 shrink-0 text-mist/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="8" r="3.2" stroke-width="1.7"></circle>
                          <path stroke-linecap="round" stroke-width="1.7" d="M5 20a7 7 0 0 1 14 0"></path>
                        </svg>
                        <span class="truncate">{{ alerta.usuario?.nombre }} {{ alerta.usuario?.apellido }}</span>
                        <span class="mono ml-auto text-[0.5rem] text-mist/60">{{ alerta.usuario?.telefono }}</span>
                      </div>
                      <button
                        type="button"
                        (click)="finalizarReservaEnAlerta(alerta._id)"
                        [disabled]="procesandoAlerta() === alerta._id"
                        class="btn btn-danger mt-2.5 h-7 w-full text-[0.58rem]"
                      >
                        @if (procesandoAlerta() === alerta._id) {
                          <span class="h-3 w-3 animate-spin rounded-full border-2 border-danger/30 border-t-danger"></span>
                          Liberando…
                        } @else {
                          Liberar puesto
                        }
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Resumen de la sede -->
          <div class="panel p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="mono text-[0.52rem] uppercase tracking-[0.16em] text-chalk">Resumen de la sede</span>
              <span class="mono text-[0.5rem] text-mist">{{ totalPuestos() }} puestos</span>
            </div>

            <div class="mb-2 flex items-center justify-between text-[0.65rem]">
              <span class="text-mist">Ocupación actual</span>
              <span class="mono font-semibold text-chalk">{{ porcentajeOcupacion() }}%</span>
            </div>
            <div class="meter"><span [style.width.%]="porcentajeOcupacion()"></span></div>

            <div class="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge bg-edge">
              <div class="bg-[#0a0e15] px-3 py-2.5">
                <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Libres</div>
                <div class="text-lg font-semibold leading-tight text-ok">{{ libresCount() }}</div>
              </div>
              <div class="bg-[#0a0e15] px-3 py-2.5">
                <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Ocupados</div>
                <div class="text-lg font-semibold leading-tight text-danger">{{ ocupadasCount() }}</div>
              </div>
              <div class="bg-[#0a0e15] px-3 py-2.5">
                <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Miembros</div>
                <div class="text-lg font-semibold leading-tight text-chalk">{{ miembrosCount() }}</div>
              </div>
              <div class="bg-[#0a0e15] px-3 py-2.5">
                <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Capacidad</div>
                <div class="text-lg font-semibold leading-tight text-chalk">{{ organizacionActual()?.totalPuestos || 0 }}</div>
              </div>
            </div>

            <div class="mono mt-3 flex items-center justify-between border-t border-edge pt-2.5 text-[0.5rem] uppercase tracking-[0.1em] text-mist">
              <span>{{ organizacionActual()?.zonaHoraria || 'America/Bogota' }}</span>
              <span class="flex items-center gap-1.5 text-ok"><span class="live-dot scale-75"></span> Socket conectado</span>
            </div>
          </div>

          <!-- Actividad -->
          <div class="panel p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="mono text-[0.52rem] uppercase tracking-[0.16em] text-chalk">Actividad reciente</span>
              <span class="mono text-[0.5rem] text-mist">Esta sesión</span>
            </div>

            @if (feedActividad().length === 0) {
              <div class="rounded-md border border-edge bg-white/[0.02] p-4 text-center text-[0.62rem] text-mist">
                Aún no hay movimientos registrados en esta sesión.
              </div>
            } @else {
              <div class="max-h-[15rem] space-y-1.5 overflow-auto pr-0.5">
                @for (act of feedActividad(); track act.id) {
                  <div class="flex items-center gap-2.5 rounded border border-transparent px-1.5 py-1.5 transition-colors hover:border-edge hover:bg-white/[0.02]">
                    <div class="notch-sm grid h-7 w-7 shrink-0 place-items-center bg-flow/15 text-[0.5rem] font-bold text-flow">
                      {{ act.usuario.charAt(0) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="truncate text-[0.64rem] font-medium text-chalk">{{ act.usuario }}</span>
                        <span class="mono shrink-0 text-[0.46rem] text-mist/60">{{ act.tiempo }}</span>
                      </div>
                      <div class="mono truncate text-[0.5rem] uppercase tracking-[0.06em] text-mist">
                        {{ act.accion }} <span class="text-mist/50">·</span> {{ act.puesto }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </aside>
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

  readonly ANCHO = 1200;
  readonly ALTO = 720;

  organizaciones = signal<Organizacion[]>([]);
  orgSeleccionadaId = signal<string>('');
  casillas = signal<Casilla[]>([]);
  alertas = signal<AlertaReserva[]>([]);
  miembrosCount = signal<number>(0);
  casillaSeleccionada = signal<Casilla | null>(null);

  busqueda = signal<string>('');
  filtroEstado = signal<'todos' | 'libres' | 'ocupados'>('todos');
  vista = signal<'plano' | 'lista'>('plano');
  zoom = signal<number>(0.58);

  cargandoCasillas = signal<boolean>(false);
  cargandoCasillaId = signal<string | null>(null);
  procesandoAlerta = signal<string | null>(null);
  mensajeFeedback = signal<string | null>(null);

  feedActividad = signal<Array<{ id: string; usuario: string; puesto: string; accion: string; tiempo: string }>>([]);

  hoy = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  private subs = new Subscription();

  esPuesto = (c: Casilla): boolean => c.tipo === 'standard' || c.tipo === 'discapacitados' || c.tipo === 'electrico';

  organizacionActual = computed(() => this.organizaciones().find((o) => o._id === this.orgSeleccionadaId()) ?? null);
  puestos = computed(() => this.casillas().filter((c) => this.esPuesto(c)));
  libresCount = computed(() => this.puestos().filter((c) => c.estado === 'libre').length);
  ocupadasCount = computed(() => this.puestos().filter((c) => c.estado === 'ocupado').length);
  totalPuestos = computed(() => this.puestos().length);
  porcentajeOcupacion = computed(() => {
    const total = this.totalPuestos();
    if (!total) return 0;
    return Math.round((this.ocupadasCount() / total) * 100);
  });
  zoomPorcentaje = computed(() => Math.round(this.zoom() * 100));
  alertaIds = computed(() => new Set(this.alertas().map((a) => a.casilla?._id).filter((id): id is string => !!id)));

  marcasOcupacion = computed(() => {
    const total = this.totalPuestos();
    if (!total) return [false, false, false, false, false, false];
    const libres = this.libresCount();
    const marcas = 12;
    return Array.from({ length: marcas }, (_, i) => i < Math.round((libres / total) * marcas));
  });

  puestosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const filtro = this.filtroEstado();

    return this.puestos().filter((c) => {
      if (termino && !`${c.codigo} ${c.seccion}`.toLowerCase().includes(termino)) return false;
      if (filtro === 'libres') return c.estado === 'libre';
      if (filtro === 'ocupados') return c.estado === 'ocupado';
      return true;
    });
  });

  private idsVisibles = computed(() => new Set(this.puestosFiltrados().map((c) => c._id)));

  casillasPlano = computed(() => this.casillas().filter((c) => !this.esPuesto(c) || this.idsVisibles().has(c._id)));

  seccionesPuestos = computed(() => {
    const mapa = new Map<string, Casilla[]>();
    for (const c of this.puestosFiltrados()) {
      const nombre = c.seccion || 'Sin sección';
      if (!mapa.has(nombre)) mapa.set(nombre, []);
      mapa.get(nombre)!.push(c);
    }

    return Array.from(mapa.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([nombre, lista]) => ({
        nombre,
        casillas: lista,
        total: lista.length,
        libres: lista.filter((c) => c.estado === 'libre').length
      }));
  });

  ngOnInit(): void {
    this.subs.add(
      this.socketService.onCasillaActualizada().subscribe((casillaAct) => {
        this.casillas.update((lista) => lista.map((c) => (c._id === casillaAct._id ? { ...c, ...casillaAct } : c)));

        if (this.casillaSeleccionada()?._id === casillaAct._id) {
          this.casillaSeleccionada.update((actual) => (actual ? { ...actual, ...casillaAct } : actual));
        }

        this.feedActividad.update((actividad) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            usuario: 'Operador / Conductor',
            puesto: casillaAct.codigo,
            accion: casillaAct.estado === 'ocupado' ? 'Ocupó' : 'Liberó',
            tiempo: 'Ahora'
          },
          ...actividad.slice(0, 8)
        ]);

        this.cargarAlertas();
      })
    );

    this.organizacionService.misOrganizaciones().subscribe({
      next: (orgs) => {
        this.organizaciones.set(orgs);
        if (orgs.length > 0) {
          this.orgSeleccionadaId.set(orgs[0]._id);
          this.cambiarOrganizacion(orgs[0]._id);
        }
      },
      error: (err) => {
        console.error('Error cargando organizaciones:', err);
        this.mensajeFeedback.set('No se pudieron cargar las sedes. Verifica tu conexión.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.orgSeleccionadaId()) {
      this.socketService.salirOrganizacion(this.orgSeleccionadaId());
    }
    this.subs.unsubscribe();
  }

  cambiarOrganizacion(id: string): void {
    if (!id) return;

    if (this.orgSeleccionadaId()) {
      this.socketService.salirOrganizacion(this.orgSeleccionadaId());
    }

    this.orgSeleccionadaId.set(id);
    this.socketService.unirseOrganizacion(id);
    this.casillaSeleccionada.set(null);
    this.filtroEstado.set('todos');
    this.busqueda.set('');
    this.feedActividad.set([
      {
        id: `${Date.now()}-sync`,
        usuario: 'Sistema',
        puesto: this.organizaciones().find((o) => o._id === id)?.nombre ?? 'Sede',
        accion: 'Sincronizó',
        tiempo: 'Ahora'
      }
    ]);
    this.cargarDatos();
  }

  cargarDatos(): void {
    const id = this.orgSeleccionadaId();
    if (!id) return;

    this.cargandoCasillas.set(true);

    this.casillaService.listarPorOrganizacion(id).subscribe({
      next: (data) => {
        this.casillas.set(this.normalizarPosiciones(data));
        this.cargandoCasillas.set(false);
      },
      error: (err) => {
        console.error('Error cargando casillas:', err);
        this.cargandoCasillas.set(false);
        this.mensajeFeedback.set('No se pudo sincronizar el plano de la sede.');
      }
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

  alternarCasilla(casilla: Casilla): void {
    this.casillaSeleccionada.set(casilla);
    if (!this.esPuesto(casilla)) return;
    this.toggleEstadoCasilla(casilla);
  }

  toggleEstadoCasilla(casilla: Casilla): void {
    if (this.cargandoCasillaId()) return;

    const nuevoEstado: 'libre' | 'ocupado' = casilla.estado === 'libre' ? 'ocupado' : 'libre';
    this.cargandoCasillaId.set(casilla._id);
    this.mensajeFeedback.set(null);

    // Actualización optimista: el socket confirma el estado final.
    this.casillas.update((lista) => lista.map((c) => (c._id === casilla._id ? { ...c, estado: nuevoEstado } : c)));
    this.casillaSeleccionada.update((actual) => (actual?._id === casilla._id ? { ...actual, estado: nuevoEstado } : actual));

    this.casillaService.cambiarEstado(casilla._id, nuevoEstado).subscribe({
      next: () => {
        this.cargandoCasillaId.set(null);
        this.mensajeFeedback.set(`Puesto ${casilla.codigo} marcado como ${nuevoEstado}. Sincronizado en tiempo real.`);
        this.feedActividad.update((actividad) => [
          {
            id: `${Date.now()}-${casilla._id}`,
            usuario: 'Tú (consola)',
            puesto: casilla.codigo,
            accion: nuevoEstado === 'ocupado' ? 'Ocupó' : 'Liberó',
            tiempo: 'Ahora'
          },
          ...actividad.slice(0, 8)
        ]);
        this.cargarAlertas();
      },
      error: (err) => {
        this.cargandoCasillaId.set(null);
        this.mensajeFeedback.set(err.error?.message || `No se pudo cambiar el estado de ${casilla.codigo}.`);
        this.cargarDatos();
      }
    });
  }

  finalizarReservaEnAlerta(reservaId: string): void {
    if (this.procesandoAlerta()) return;

    this.procesandoAlerta.set(reservaId);
    this.mensajeFeedback.set(null);

    this.reservaService.finalizarReserva(reservaId).subscribe({
      next: () => {
        this.procesandoAlerta.set(null);
        this.mensajeFeedback.set('Reserva finalizada y puesto liberado correctamente.');
        this.cargarDatos();
        this.feedActividad.update((actividad) => [
          {
            id: `${Date.now()}-alerta`,
            usuario: 'Tú (consola)',
            puesto: 'Alerta',
            accion: 'Liberó',
            tiempo: 'Ahora'
          },
          ...actividad.slice(0, 8)
        ]);
      },
      error: (err) => {
        this.procesandoAlerta.set(null);
        this.mensajeFeedback.set(err.error?.message || 'No se pudo finalizar la reserva.');
      }
    });
  }

  esVisible(casilla: Casilla): boolean {
    return this.idsVisibles().has(casilla._id);
  }

  cambiarZoom(delta: number): void {
    this.zoom.set(Math.max(0.35, Math.min(1.1, Number((this.zoom() + delta).toFixed(2)))));
  }

  resetZoom(): void {
    this.zoom.set(0.58);
  }

  tipoCorto(tipo: Casilla['tipo']): string {
    const etiquetas: Record<string, string> = {
      standard: 'Estándar',
      discapacitados: 'Movilidad',
      electrico: 'Eléctrico',
      entrada: 'Entrada',
      salida: 'Salida',
      carril: 'Carril'
    };
    return etiquetas[tipo] || 'Estándar';
  }

  anchoDe(c: Casilla): number {
    if (c.tipo === 'carril') return 360;
    if (c.tipo === 'entrada' || c.tipo === 'salida') return 132;
    return 88;
  }

  altoDe(c: Casilla): number {
    return c.tipo === 'carril' ? 84 : c.tipo === 'entrada' || c.tipo === 'salida' ? 84 : 120;
  }

  private normalizarPosiciones(data: Casilla[]): Casilla[] {
    const ocupadas = new Set<string>();
    let autoIndice = 0;

    const siguienteAuto = (): { x: number; y: number } => {
      for (let i = 0; i < 140; i++) {
        const col = autoIndice % 10;
        const fila = Math.floor(autoIndice / 10);
        autoIndice++;
        const x = 70 + col * 105;
        const y = 70 + fila * 130;
        if (!ocupadas.has(`${x},${y}`) && y < this.ALTO - 120) return { x, y };
      }
      return { x: 70, y: 70 };
    };

    return data.map((c) => {
      let posX = typeof c.posX === 'number' ? c.posX : 0;
      let posY = typeof c.posY === 'number' ? c.posY : 0;

      if ((posX === 0 && posY === 0) || ocupadas.has(`${posX},${posY}`)) {
        const pos = siguienteAuto();
        posX = pos.x;
        posY = pos.y;
      }

      posX = Math.max(0, Math.min(posX, this.ANCHO - this.anchoDe(c)));
      posY = Math.max(0, Math.min(posY, this.ALTO - this.altoDe(c)));
      ocupadas.add(`${posX},${posY}`);

      return { ...c, posX, posY, rotacion: c.rotacion || 0 };
    });
  }
}
