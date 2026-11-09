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

    <main class="mx-auto max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8">
      <!-- Migas -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge pb-3">
        <a routerLink="/organizaciones" class="group inline-flex items-center gap-1.5 text-[0.62rem] font-medium text-mist transition-colors hover:text-chalk">
          <svg class="h-3 w-3 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5m5 5-5-5 5-5"></path>
          </svg>
          Todas mis sedes
        </a>
        <span class="mono flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.14em] text-mist">
          <span class="live-dot scale-75"></span>
          WebSocket · sincronización en vivo
        </span>
      </div>

      <!-- Encabezado -->
      <div class="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div class="min-w-0 rise">
          <span class="kicker">Sede / Vista del conductor</span>
          <div class="mt-3 flex flex-wrap items-center gap-2.5">
            <h1 class="truncate text-3xl font-semibold tracking-[-0.04em] text-chalk sm:text-4xl">{{ organizacion()?.nombre || 'Cargando sede…' }}</h1>
            @if (organizacion()?.tipoEntidad) {
              <span class="tag tag-flow">{{ organizacion()?.tipoEntidad }}</span>
            }
          </div>
          <p class="mt-2 max-w-xl text-[0.72rem] leading-relaxed text-mist">
            {{ organizacion()?.direccion || 'Consulta la disponibilidad y reserva tu puesto en tiempo real.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 rise-2">
          <!-- Ocupación -->
          <div class="panel-flat flex items-center gap-3.5 px-4 py-3">
            <div
              class="relative grid h-14 w-14 place-items-center rounded-full"
              [style.background]="'conic-gradient(#d8ff3e 0 ' + porcentajeOcupacion() + '%, #1b2230 ' + porcentajeOcupacion() + '% 100%)'"
            >
              <div class="grid h-[2.6rem] w-[2.6rem] place-items-center rounded-full bg-panel">
                <span class="mono text-[0.7rem] font-semibold text-chalk">{{ porcentajeOcupacion() }}%</span>
              </div>
            </div>
            <div>
              <div class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist">Ocupación total</div>
              <div class="text-base font-semibold leading-tight text-chalk">{{ ocupadasCount() }} <span class="text-[0.6rem] font-normal text-mist">de {{ totalPuestos() }}</span></div>
              <div class="mono mt-0.5 text-[0.5rem] text-ok">{{ libresCount() }} disponibles</div>
            </div>
          </div>

          @if (authService.userRole() === 'administrador') {
            <a
              [routerLink]="['/organizaciones', organizacionId(), 'disenador']"
              class="btn btn-ghost h-[4.35rem] flex-col gap-1 px-4"
            >
              <svg class="h-4 w-4 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              <span class="mono text-[0.5rem] uppercase tracking-[0.1em]">Editar plano</span>
            </a>
          }
        </div>
      </div>

      <!-- Barra de filtros -->
      <section class="panel mt-5 p-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-1 flex-wrap items-center gap-2">
            <div class="relative min-w-[13rem] flex-1 sm:max-w-xs">
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
                placeholder="Buscar puesto (A1, B3…)"
                class="field h-9 pl-8 text-[0.7rem]"
              />
            </div>

            <div class="flex items-center gap-1 rounded-md border border-edge p-0.5">
              <button
                type="button"
                (click)="filtroTipo.set('todos')"
                class="rounded px-2.5 py-1.5 text-[0.6rem] font-medium transition-colors"
                [ngClass]="filtroTipo() === 'todos' ? 'bg-white/[0.07] text-chalk' : 'text-mist hover:text-chalk'"
              >
                Todos
              </button>
              <button
                type="button"
                (click)="filtroTipo.set('libre')"
                class="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[0.6rem] font-medium transition-colors"
                [ngClass]="filtroTipo() === 'libre' ? 'bg-ok/[0.12] text-ok' : 'text-mist hover:text-chalk'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-ok"></span> Libres
              </button>
              <button
                type="button"
                (click)="filtroTipo.set('discapacitados')"
                class="rounded px-2.5 py-1.5 text-[0.6rem] font-medium transition-colors"
                [ngClass]="filtroTipo() === 'discapacitados' ? 'bg-flow/[0.12] text-flow' : 'text-mist hover:text-chalk'"
              >
                Movilidad
              </button>
              <button
                type="button"
                (click)="filtroTipo.set('electrico')"
                class="rounded px-2.5 py-1.5 text-[0.6rem] font-medium transition-colors"
                [ngClass]="filtroTipo() === 'electrico' ? 'bg-warn/[0.12] text-warn' : 'text-mist hover:text-chalk'"
              >
                Eléctrico
              </button>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <div class="flex items-center overflow-hidden rounded-md border border-edge">
              <button
                type="button"
                (click)="vistaModo.set('plano')"
                class="px-2.5 py-1.5 text-[0.6rem] font-semibold transition-colors"
                [ngClass]="vistaModo() === 'plano' ? 'bg-signal text-void' : 'text-mist hover:text-chalk'"
              >
                Plano
              </button>
              <button
                type="button"
                (click)="vistaModo.set('secciones')"
                class="px-2.5 py-1.5 text-[0.6rem] font-semibold transition-colors"
                [ngClass]="vistaModo() === 'secciones' ? 'bg-signal text-void' : 'text-mist hover:text-chalk'"
              >
                Secciones
              </button>
            </div>

            <button
              type="button"
              (click)="cargarCasillas()"
              class="btn btn-ghost h-9 px-2.5"
              title="Sincronizar manualmente"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"></path>
              </svg>
              <span class="hidden sm:inline">Sincronizar</span>
            </button>
          </div>
        </div>
      </section>

      <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <!-- Mapa -->
        <section class="panel overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">{{ vistaModo() === 'plano' ? 'Plano espacial' : 'Vista por secciones' }}</span>
              <span class="tag tag-muted">{{ casillasFiltradas().length }} visibles</span>
            </div>
            @if (vistaModo() === 'plano') {
              <div class="flex items-center gap-1.5">
                <span class="mono text-[0.48rem] uppercase tracking-[0.12em] text-mist">Zoom</span>
                <div class="flex items-center overflow-hidden rounded border border-edge">
                  <button type="button" (click)="cambiarZoom(-0.1)" class="grid h-7 w-7 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M5 12h14"></path></svg>
                  </button>
                  <span class="mono border-x border-edge px-2 text-[0.52rem] text-chalk">{{ zoomPorcentaje() }}%</span>
                  <button type="button" (click)="cambiarZoom(0.1)" class="grid h-7 w-7 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14"></path></svg>
                  </button>
                </div>
              </div>
            } @else {
              <span class="mono text-[0.5rem] uppercase tracking-[0.12em] text-mist">{{ secciones().length }} zonas</span>
            }
          </div>

          @if (vistaModo() === 'plano') {
            <div class="relative h-[30rem] overflow-auto bg-[#06090e] sm:h-[36rem] xl:h-[39rem]">
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
                    <span class="mono pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-[0.5rem] uppercase tracking-[0.24em] text-mist/30">{{ organizacion()?.nombre }}</span>
                    <div class="pointer-events-none absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 text-mist/30">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 20V4m0 0-4 4m4-4 4 4"></path>
                      </svg>
                      <span class="mono text-[0.5rem]">N</span>
                    </div>

                    @for (c of casillasFiltradas(); track c._id) {
                      <button
                        type="button"
                        class="bay"
                        [attr.data-tipo]="c.tipo"
                        [attr.data-estado]="esPuesto(c) ? c.estado : null"
                        [class.is-selected]="casillaSeleccionada()?._id === c._id"
                        [style.left.px]="c.posX || 0"
                        [style.top.px]="c.posY || 0"
                        [style.width.px]="anchoDe(c)"
                        [style.height.px]="altoDe(c)"
                        [style.transform]="'rotate(' + (c.rotacion || 0) + 'deg)'"
                        (click)="seleccionarCasilla(c)"
                        [title]="c.codigo + ' · ' + (esPuesto(c) ? c.estado : c.tipo)"
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
                      </button>
                    }

                    @if (casillasFiltradas().length === 0) {
                      <div class="absolute inset-0 flex flex-col items-center justify-center text-center text-mist">
                        <p class="text-xs">No hay puestos que coincidan con el filtro.</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="max-h-[39rem] space-y-3 overflow-auto p-4">
              @for (grupo of secciones(); track grupo.nombre) {
                <div class="panel-flat overflow-hidden">
                  <div class="flex items-center justify-between border-b border-edge px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span class="h-1.5 w-1.5 rounded-full bg-flow"></span>
                      <span class="text-[0.7rem] font-semibold text-chalk">{{ grupo.nombre }}</span>
                    </div>
                    <span class="mono text-[0.52rem] text-mist">{{ grupo.libres }}/{{ grupo.total }} libres</span>
                  </div>
                  <div class="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-6 md:grid-cols-8">
                    @for (c of grupo.casillas; track c._id) {
                      <button
                        type="button"
                        class="mini-bay"
                        [attr.data-tipo]="c.tipo"
                        [attr.data-estado]="esPuesto(c) ? c.estado : null"
                        [class.mini-bay-selected]="casillaSeleccionada()?._id === c._id"
                        (click)="seleccionarCasilla(c)"
                      >
                        <span class="text-[0.6rem] font-bold leading-none">{{ c.codigo }}</span>
                        <span class="mono mt-0.5 text-[0.4rem] uppercase tracking-[0.08em] opacity-70">
                          {{ esPuesto(c) ? (c.estado === 'libre' ? 'Libre' : 'Ocup.') : tipoCorto(c.tipo) }}
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }
              @if (secciones().length === 0) {
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
            <span class="mono flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.1em] text-ok">
              <span class="live-dot scale-75"></span> Sensores activos
            </span>
          </div>
        </section>

        <!-- Detalle -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          @if (casillaSeleccionada(); as sel) {
            <div class="panel overflow-hidden">
              <div class="flex items-center justify-between border-b border-edge px-4 py-3">
                <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">Puesto seleccionado</span>
                @if (esPuesto(sel)) {
                  <span class="tag" [ngClass]="sel.estado === 'libre' ? 'tag-ok' : 'tag-danger'">{{ sel.estado === 'libre' ? 'Disponible' : 'Ocupado' }}</span>
                } @else {
                  <span class="tag tag-muted">{{ tipoCorto(sel.tipo) }}</span>
                }
              </div>

              <div class="p-4">
                <div class="relative overflow-hidden rounded-lg border border-edge bg-[#070a10] p-5 text-center">
                  <div class="absolute inset-0 dot-grid opacity-20"></div>
                  <div class="relative">
                    <div class="mono text-5xl font-semibold tracking-[-0.04em] text-chalk">{{ sel.codigo }}</div>
                    <div class="mono mt-2 text-[0.52rem] uppercase tracking-[0.16em] text-mist">{{ sel.seccion }} · {{ tipoCorto(sel.tipo) }}</div>
                  </div>
                  <span class="absolute left-2 top-2 h-3 w-3 border-l border-t border-signal/35"></span>
                  <span class="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-signal/35"></span>
                </div>

                @if (esPuesto(sel)) {
                  <div class="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-edge bg-edge">
                    <div class="bg-[#0a0e15] px-3 py-2.5">
                      <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Tipo</div>
                      <div class="mt-0.5 text-[0.7rem] font-medium text-chalk">{{ tipoCorto(sel.tipo) }}</div>
                    </div>
                    <div class="bg-[#0a0e15] px-3 py-2.5">
                      <div class="mono text-[0.46rem] uppercase tracking-[0.14em] text-mist">Estado</div>
                      <div class="mt-0.5 text-[0.7rem] font-medium" [ngClass]="sel.estado === 'libre' ? 'text-ok' : 'text-danger'">{{ sel.estado === 'libre' ? 'Inmediata' : 'En uso' }}</div>
                    </div>
                  </div>
                }

                @if (mensajeAccion()) {
                  <div class="mt-4 rounded-md border border-flow/30 bg-flow/[0.07] p-2.5 text-[0.65rem] leading-relaxed text-flow">
                    {{ mensajeAccion() }}
                  </div>
                }

                @if (esPuesto(sel) && sel.estado === 'libre') {
                  <div class="mt-4 space-y-3 border-t border-edge pt-4">
                    <h3 class="mono text-[0.52rem] uppercase tracking-[0.16em] text-mist">Reservar este puesto</h3>

                    <div>
                      <label class="label" for="placa">Placa del vehículo</label>
                      <input
                        id="placa"
                        type="text"
                        [(ngModel)]="placaReserva"
                        placeholder="ABC-123"
                        class="field field-mono uppercase tracking-[0.12em]"
                      />
                    </div>

                    <div>
                      <label class="label" for="duracion">Duración</label>
                      <select id="duracion" [(ngModel)]="duracionHoras" class="field">
                        <option [ngValue]="1">1 hora</option>
                        <option [ngValue]="2">2 horas</option>
                        <option [ngValue]="3">3 horas</option>
                        <option [ngValue]="4">4 horas</option>
                        <option [ngValue]="8">8 horas · jornada</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      (click)="reservarCasilla(sel)"
                      [disabled]="cargandoAccion() || !placaReserva.trim()"
                      class="btn btn-signal h-10 w-full"
                    >
                      @if (cargandoAccion()) {
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                        <span>Procesando…</span>
                      } @else {
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
                        </svg>
                        <span>Reservar puesto</span>
                      }
                    </button>
                  </div>
                } @else if (esPuesto(sel)) {
                  <div class="mt-4 border-t border-edge pt-4">
                    @if (miReservaEnCasilla(sel); as res) {
                      <div class="rounded-md border border-warn/25 bg-warn/[0.06] p-3 text-[0.65rem] leading-relaxed text-warn">
                        Tienes una reserva activa en este puesto con la placa <strong class="mono">{{ res.placa }}</strong>.
                      </div>
                      <button
                        type="button"
                        (click)="finalizarMiReserva(res._id)"
                        [disabled]="cargandoAccion()"
                        class="btn btn-danger mt-3 h-9 w-full"
                      >
                        Finalizar y liberar puesto
                      </button>
                    } @else {
                      <div class="rounded-md border border-edge bg-white/[0.02] p-3 text-center text-[0.65rem] text-mist">
                        Este puesto está ocupado por otro vehículo.
                      </div>
                    }
                  </div>
                } @else {
                  <div class="mt-4 rounded-md border border-edge bg-white/[0.02] p-3 text-[0.65rem] leading-relaxed text-mist">
                    Elemento de circulación: {{ sel.tipo === 'carril' ? 'vía interna del parqueadero' : 'acceso vehicular de la sede' }}.
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="panel p-6 text-center">
              <div class="notch-sm mx-auto grid h-11 w-11 place-items-center border border-flow/25 bg-flow/[0.07] text-flow">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="m5 4 14 6-6 2-2 6-6-14Z"></path>
                </svg>
              </div>
              <h2 class="mt-3 text-sm font-semibold text-chalk">Selecciona una casilla</h2>
              <p class="mt-1 text-[0.65rem] leading-relaxed text-mist">Haz clic en cualquier puesto del plano para ver su estado y reservarlo.</p>
            </div>
          }

          <div class="panel p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="mono text-[0.52rem] uppercase tracking-[0.16em] text-chalk">Resumen del parqueadero</span>
              <span class="mono text-[0.5rem] text-mist">{{ totalPuestos() }} puestos</span>
            </div>
            <div class="mb-2 flex items-center justify-between text-[0.65rem]">
              <span class="text-mist">Ocupación</span>
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
            </div>
          </div>
        </aside>
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

  readonly ANCHO = 1200;
  readonly ALTO = 720;

  organizacionId = signal<string>('');
  organizacion = signal<Organizacion | null>(null);
  casillas = signal<Casilla[]>([]);
  misReservas = signal<Reserva[]>([]);
  casillaSeleccionada = signal<Casilla | null>(null);

  busqueda = signal<string>('');
  filtroTipo = signal<'todos' | 'libre' | 'discapacitados' | 'electrico'>('todos');
  vistaModo = signal<'plano' | 'secciones'>('plano');
  zoom = signal<number>(0.66);

  placaReserva = '';
  duracionHoras = 2;
  cargandoAccion = signal<boolean>(false);
  mensajeAccion = signal<string | null>(null);

  private subs = new Subscription();

  esPuesto = (c: Casilla): boolean => c.tipo === 'standard' || c.tipo === 'discapacitados' || c.tipo === 'electrico';

  puestos = computed(() => this.casillas().filter((c) => this.esPuesto(c)));
  libresCount = computed(() => this.puestos().filter((c) => c.estado === 'libre').length);
  ocupadasCount = computed(() => this.puestos().filter((c) => c.estado === 'ocupado').length);
  totalPuestos = computed(() => this.puestos().length);
  zoomPorcentaje = computed(() => Math.round(this.zoom() * 100));
  porcentajeOcupacion = computed(() => {
    const total = this.totalPuestos();
    if (!total) return 0;
    return Math.round((this.ocupadasCount() / total) * 100);
  });

  casillasFiltradas = computed(() => {
    let lista = this.casillas();
    const termino = this.busqueda().trim().toLowerCase();
    if (termino) {
      return lista.filter((c) => c.codigo.toLowerCase().includes(termino));
    }

    const filtro = this.filtroTipo();
    if (filtro === 'todos') return lista;

    if (filtro === 'libre') {
      return lista.filter((c) => !this.esPuesto(c) || c.estado === 'libre');
    }
    return lista.filter((c) => !this.esPuesto(c) || c.tipo === filtro);
  });

  secciones = computed(() => {
    const mapa = new Map<string, Casilla[]>();
    for (const c of this.casillasFiltradas()) {
      const nombre = c.seccion || 'Sin sección';
      if (!mapa.has(nombre)) mapa.set(nombre, []);
      mapa.get(nombre)!.push(c);
    }

    return Array.from(mapa.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([nombre, lista]) => ({
        nombre,
        casillas: lista,
        total: lista.filter((c) => this.esPuesto(c)).length,
        libres: lista.filter((c) => this.esPuesto(c) && c.estado === 'libre').length
      }));
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
        this.socketService.onCasillaActualizada().subscribe((casillaAct) => {
          this.casillas.update((lista) => lista.map((c) => (c._id === casillaAct._id ? { ...c, ...casillaAct } : c)));
          this.casillaSeleccionada.update((actual) => (actual?._id === casillaAct._id ? { ...actual, ...casillaAct } : actual));
        })
      );

      this.subs.add(this.socketService.onReservaCreada().subscribe(() => this.cargarMisReservas()));
      this.subs.add(this.socketService.onReservaFinalizada().subscribe(() => this.cargarMisReservas()));

      this.subs.add(
        this.route.queryParamMap.subscribe(() => {
          if (this.casillas().length > 0) this.aplicarCasillaDesdeUrl();
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
    this.organizacionService.misOrganizaciones().subscribe((orgs) => {
      const match = orgs.find((o) => o._id === id);
      if (match) this.organizacion.set(match);
    });
  }

  cargarCasillas(): void {
    this.casillaService.listarPorOrganizacion(this.organizacionId()).subscribe({
      next: (data) => {
        this.casillas.set(this.normalizarPosiciones(data));
        this.aplicarCasillaDesdeUrl();
      },
      error: (err) => console.error('Error al cargar casillas:', err)
    });
  }

  /** Preselecciona un puesto cuando se llega desde la búsqueda global (?casilla=A3). */
  private aplicarCasillaDesdeUrl(): void {
    const codigo = this.route.snapshot.queryParamMap.get('casilla');
    if (!codigo) return;
    const match = this.casillas().find((c) => c.codigo.toLowerCase() === codigo.toLowerCase());
    if (match) this.seleccionarCasilla(match);
  }

  cargarMisReservas(): void {
    this.reservaService.misReservas().subscribe({
      next: (data) => this.misReservas.set(data.filter((r) => r.estado === 'activa')),
      error: (err) => console.error('Error al cargar reservas:', err)
    });
  }

  seleccionarCasilla(c: Casilla): void {
    this.casillaSeleccionada.set(c);
    this.mensajeAccion.set(null);
  }

  miReservaEnCasilla(c: Casilla): Reserva | undefined {
    return this.misReservas().find((r) => {
      const cId = typeof r.casilla === 'object' ? r.casilla._id : r.casilla;
      return cId === c._id;
    });
  }

  reservarCasilla(casilla: Casilla): void {
    if (!this.placaReserva.trim()) return;

    this.cargandoAccion.set(true);
    this.mensajeAccion.set(null);

    this.reservaService
      .crearReserva({
        casilla: casilla._id,
        placa: this.placaReserva.trim().toUpperCase(),
        duracionHoras: Number(this.duracionHoras)
      })
      .subscribe({
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

  cambiarZoom(delta: number): void {
    this.zoom.set(Math.max(0.4, Math.min(1.4, Number((this.zoom() + delta).toFixed(2)))));
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
