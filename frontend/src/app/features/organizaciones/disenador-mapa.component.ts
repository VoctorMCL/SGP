import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CasillaService } from '../../core/services/casilla.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { AuthService } from '../../core/services/auth.service';
import { Casilla, Organizacion } from '../../core/models';

type TipoElemento = 'standard' | 'discapacitados' | 'electrico' | 'entrada' | 'salida' | 'carril';

interface ElementoDiseno {
  uid: string;
  _id?: string;
  codigo: string;
  seccion: string;
  tipo: TipoElemento;
  estado: 'libre' | 'ocupado';
  posX: number;
  posY: number;
  rotacion: number;
  esNuevo?: boolean;
}

interface Feedback {
  tipo: 'ok' | 'warn' | 'error';
  texto: string;
}

@Component({
  selector: 'app-disenador-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="mx-auto max-w-[94rem] px-4 py-6 sm:px-6 lg:px-8">
      <!-- Encabezado -->
      <div class="flex flex-col gap-5 border-b border-edge pb-5 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <a routerLink="/organizaciones" class="mono text-[0.55rem] uppercase tracking-[0.16em] text-mist transition-colors hover:text-chalk">Mis sedes</a>
            <span class="text-mist/40">/</span>
            <span class="mono text-[0.55rem] uppercase tracking-[0.16em] text-signal">Editor de plano</span>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 class="text-3xl font-semibold tracking-[-0.04em] text-chalk sm:text-4xl">Dibuja tu parqueadero</h1>
            <span class="tag tag-flow">{{ organizacion()?.nombre || 'Sede' }}</span>
          </div>
          <p class="mt-2 max-w-2xl text-[0.72rem] leading-relaxed text-mist">
            Arrastra para mover · usa el tirador superior para girar · haz clic con una herramienta activa para colocar casillas, entradas y salidas.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="mono mr-1 inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.12em]" [ngClass]="hayCambios() ? 'text-warn' : 'text-ok'">
            <span class="h-1.5 w-1.5 rounded-full" [ngClass]="hayCambios() ? 'bg-warn' : 'bg-ok'"></span>
            {{ hayCambios() ? 'Sin guardar' : 'Guardado' }}
          </span>

          <a
            [routerLink]="['/mapa', organizacionId()]"
            class="btn btn-ghost"
            title="Abrir la vista del conductor"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
              <circle cx="12" cy="12" r="2.6" stroke-width="1.8"></circle>
            </svg>
            <span class="hidden sm:inline">Vista conductor</span>
          </a>

          <button type="button" (click)="guardarDiseno()" [disabled]="guardando() || !puedeEditar()" class="btn btn-signal h-9">
            @if (guardando()) {
              <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
              <span>Guardando…</span>
            } @else {
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12.5 9 17l10-10"></path>
              </svg>
              <span>Guardar plano</span>
            }
          </button>
        </div>
      </div>

      @if (feedback(); as f) {
        <div
          class="mt-4 flex items-start justify-between gap-3 rounded-md border p-3 text-[0.7rem]"
          [ngClass]="{
            'border-ok/30 bg-ok/[0.07] text-ok': f.tipo === 'ok',
            'border-warn/30 bg-warn/[0.07] text-warn': f.tipo === 'warn',
            'border-danger/30 bg-danger/[0.07] text-danger': f.tipo === 'error'
          }"
        >
          <span class="flex items-start gap-2">
            <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (f.tipo === 'ok') {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
              } @else {
                <circle cx="12" cy="12" r="9" stroke-width="1.8"></circle>
                <path stroke-linecap="round" stroke-width="1.8" d="M12 8v4m0 3.5v.01"></path>
              }
            </svg>
            {{ f.texto }}
          </span>
          <button type="button" (click)="feedback.set(null)" class="text-current/70 transition-opacity hover:opacity-100" aria-label="Cerrar aviso">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
      }

      @if (!puedeEditar()) {
        <div class="mt-4 flex items-start gap-2 rounded-md border border-warn/30 bg-warn/[0.07] p-3 text-[0.7rem] text-warn">
          <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v4m0 3.5v.01M10.3 3.9 2.6 17.2A1.8 1.8 0 0 0 4.2 20h15.6a1.8 1.8 0 0 0 1.6-2.8L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z"></path>
          </svg>
          <span>Solo el creador de la sede puede modificar el plano. Puedes verlo, pero no guardar cambios.</span>
        </div>
      }

      <!-- Barra de herramientas -->
      <section class="panel mt-4 p-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="mono mr-1 hidden text-[0.52rem] uppercase tracking-[0.16em] text-mist lg:inline">Herramientas</span>

            <button
              type="button"
              (click)="seleccionarHerramienta('select')"
              class="tool-btn"
              [class.tool-btn-active]="herramienta() === 'select'"
              title="Mover y seleccionar (Esc)"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m5 4 14 6-6 2-2 6-6-14Z"></path>
              </svg>
              Mover
            </button>

            @for (t of tipos; track t.id) {
              <button
                type="button"
                (click)="seleccionarHerramienta(t.id)"
                class="tool-btn"
                [class.tool-btn-active]="herramienta() === t.id"
                [title]="'Colocar ' + t.label"
              >
                <span class="h-1.5 w-1.5 rounded-full" [ngClass]="t.dot"></span>
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @switch (t.id) {
                    @case ('standard') {
                      <rect x="5" y="4" width="14" height="16" rx="1.5" stroke-width="1.7"></rect>
                      <path stroke-width="1.7" d="M9 16V8h3.4a2.6 2.6 0 0 1 0 5.2H9"></path>
                    }
                    @case ('discapacitados') {
                      <circle cx="11" cy="5" r="1.7" stroke-width="1.7"></circle>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M11 8v6h5.5l2 5M8 10.5a4.5 4.5 0 1 0 5 7.5"></path>
                    }
                    @case ('electrico') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="m13 3-8 11h6l-1 7 8-11h-6l1-7Z"></path>
                    }
                    @case ('entrada') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"></path>
                    }
                    @case ('salida') {
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M12 21V9m0 0 4 4M12 9l-4 4M5 3h14"></path>
                    }
                    @case ('carril') {
                      <path stroke-linecap="round" stroke-width="1.7" d="M4 12h16M8 8v8M16 8v8" stroke-dasharray="2 3"></path>
                    }
                  }
                </svg>
                <span class="hidden sm:inline">{{ t.label }}</span>
              </button>
            }
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" (click)="generarFila('A', 6)" class="btn btn-ghost h-8 px-2.5 text-[0.6rem]">
              <svg class="h-3 w-3 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-width="1.8" d="M12 5v14M5 12h14"></path>
              </svg>
              Fila de 6
            </button>

            <span class="mx-0.5 hidden h-5 w-px bg-edge sm:block"></span>

            <button
              type="button"
              (click)="snap.set(!snap())"
              class="tool-btn h-8"
              [class.tool-btn-active]="snap()"
              title="Ajustar a la cuadrícula"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-width="1.7" d="M3 9h18M3 15h18M9 3v18M15 3v18"></path>
              </svg>
              Snap
            </button>

            <button
              type="button"
              (click)="mostrarGrilla.set(!mostrarGrilla())"
              class="tool-btn h-8"
              [class.tool-btn-active]="mostrarGrilla()"
              title="Mostrar u ocultar cuadrícula"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="1" stroke-width="1.7"></rect>
                <path stroke-width="1.7" d="M4 10h16M10 4v16"></path>
              </svg>
              Grid
            </button>

            <button
              type="button"
              (click)="alternarSatelite()"
              class="tool-btn h-8"
              [class.tool-btn-active]="satelite()"
              title="Mostrar u ocultar la vista satélite"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" stroke-width="1.7"></circle>
                <path stroke-width="1.5" d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.3 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.3-3.8-8.5S9.5 5.9 12 3.5Z"></path>
              </svg>
              <span class="hidden sm:inline">Satélite</span>
            </button>

            <span class="mx-0.5 hidden h-5 w-px bg-edge sm:block"></span>

            <div class="flex items-center overflow-hidden rounded border border-edge">
              <button type="button" (click)="cambiarZoom(-0.1)" class="grid h-8 w-8 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk" title="Alejar">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-width="2" d="M5 12h14"></path>
                </svg>
              </button>
              <button type="button" (click)="resetZoom()" class="mono h-8 min-w-[3rem] border-x border-edge px-1 text-[0.55rem] text-chalk transition-colors hover:bg-white/[0.04]" title="Ajustar al recuadro">
                {{ zoomPorcentaje() }}%
              </button>
              <button type="button" (click)="cambiarZoom(0.1)" class="grid h-8 w-8 place-items-center text-mist transition-colors hover:bg-white/[0.04] hover:text-chalk" title="Acercar">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-2.5">
          <p class="mono text-[0.54rem] uppercase tracking-[0.1em] text-mist">
            @if (herramienta() === 'select') {
              Modo selección · arrastra los elementos para moverlos · <span class="text-signal">R</span> gira 15°
            } @else {
              Modo dibujo · haz clic en el lienzo para colocar {{ tipoEtiqueta(herramienta()) }} · <span class="text-signal">Esc</span> para salir
            }
          </p>
          <div class="flex items-center gap-3 text-[0.55rem] text-mist">
            <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-ok"></span>{{ libresCount() }} libres</span>
            <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-danger"></span>{{ ocupadasCount() }} ocupadas</span>
            <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-mist"></span>{{ elementos().length }} elementos</span>
          </div>
        </div>
      </section>

      <!-- Lienzo + inspector -->
      <div class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20.5rem]">
        <div class="min-w-0 space-y-4">
        <section class="panel overflow-hidden">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-4 py-2.5">
            <div class="flex items-center gap-2">
              <span class="live-dot scale-75"></span>
              <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">Lienzo del plano</span>
              <span class="mono text-[0.5rem] text-mist/50">1200 × 720 px</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="mono text-[0.5rem] uppercase tracking-[0.12em] text-mist">X <span class="text-chalk">{{ cursorPos().x }}</span> · Y <span class="text-chalk">{{ cursorPos().y }}</span></span>
              <span class="tag tag-muted hidden sm:inline">1:100</span>
            </div>
          </div>

          <div class="relative">
            <div #marcoPlano class="relative aspect-[5/3] overflow-auto bg-[#06090e]">
            <div class="flex min-h-full min-w-full">
              <div
                class="relative m-auto shrink-0"
                [style.width.px]="ANCHO * zoom()"
                [style.height.px]="ALTO * zoom()"
              >
                <div
                  id="plan-surface"
                  class="plan-surface absolute left-0 top-0 origin-top-left"
                  [class.no-grid]="!mostrarGrilla()"
                  [style.width.px]="ANCHO"
                  [style.height.px]="ALTO"
                  [style.transform]="'scale(' + zoom() + ')'"
                  [class.cursor-crosshair]="herramienta() !== 'select'"
                  [class.plan-satelite-moviendo]="satelite() && moverSatelite()"
                  (click)="alClickLienzo($event)"
                  (pointermove)="alMoverSobreLienzo($event)"
                >
                  <!-- Capa satelital de fondo (debajo de la cuadrícula y los elementos) -->
                  @if (satelite()) {
                    <div class="plan-satelite" [class.plan-satelite--interactivo]="moverSatelite()">
                      <div id="mapa-satelite-plano" class="plan-satelite-mapa"></div>
                    </div>
                  }

                  <!-- Marco y rótulos -->
                  <div class="pointer-events-none absolute inset-0 border border-edge-strong/40"></div>
                  <span class="pointer-events-none absolute left-2 top-2 z-10 h-5 w-5 border-l border-t border-signal/35"></span>
                  <span class="pointer-events-none absolute right-2 top-2 z-10 h-5 w-5 border-r border-t border-signal/35"></span>
                  <span class="pointer-events-none absolute bottom-2 left-2 z-10 h-5 w-5 border-b border-l border-signal/35"></span>
                  <span class="pointer-events-none absolute bottom-2 right-2 z-10 h-5 w-5 border-b border-r border-signal/35"></span>

                  <span class="mono pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-[0.5rem] uppercase tracking-[0.24em] text-mist/30">Plano de estacionamiento · {{ organizacion()?.nombre }}</span>
                  <div class="pointer-events-none absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 text-mist/30">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 20V4m0 0-4 4m4-4 4 4"></path>
                    </svg>
                    <span class="mono text-[0.5rem]">N</span>
                  </div>

                  <!-- Elementos -->
                  @for (elem of elementos(); track elem.uid) {
                    <div
                      class="bay group/bay"
                      [attr.data-tipo]="elem.tipo"
                      [attr.data-estado]="elem.tipo === 'standard' || elem.tipo === 'discapacitados' || elem.tipo === 'electrico' ? elem.estado : null"
                      [class.is-selected]="seleccionadoId() === elem.uid"
                      [style.left.px]="elem.posX"
                      [style.top.px]="elem.posY"
                      [style.width.px]="anchoDe(elem)"
                      [style.height.px]="altoDe(elem)"
                      [style.transform]="'rotate(' + elem.rotacion + 'deg)'"
                      [style.cursor]="herramienta() === 'select' ? 'grab' : 'crosshair'"
                      (click)="$event.stopPropagation(); seleccionarElemento(elem)"
                      (pointerdown)="iniciarArrastre($event, elem)"
                    >
                      @switch (elem.tipo) {
                        @case ('standard') {
                          <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M5 16v-4.2L6.8 7h10.4L19 11.8V16M4 16h16v3H4zM7 16v2m10-2v2"></path>
                            <path stroke-width="1.3" d="M7 11.5h10"></path>
                          </svg>
                          <span class="bay-code">{{ elem.codigo }}</span>
                          <span class="bay-meta">{{ elem.seccion }}</span>
                        }
                        @case ('discapacitados') {
                          <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="4.6" r="1.7" stroke-width="1.6"></circle>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M11 8v5.5h5l2 5.5M8 10a4.6 4.6 0 1 0 5.4 7.4"></path>
                          </svg>
                          <span class="bay-code">{{ elem.codigo }}</span>
                          <span class="bay-meta">Movilidad</span>
                        }
                        @case ('electrico') {
                          <svg class="bay-glyph h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="m13 3-8 11h6l-1 7 8-11h-6l1-7Z"></path>
                          </svg>
                          <span class="bay-code">{{ elem.codigo }}</span>
                          <span class="bay-meta">Eléctrico</span>
                        }
                        @case ('entrada') {
                          <svg class="bay-glyph h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"></path>
                          </svg>
                          <span class="bay-code">{{ elem.codigo }}</span>
                          <span class="bay-meta">{{ elem.seccion }}</span>
                        }
                        @case ('salida') {
                          <svg class="bay-glyph h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21V9m0 0 4 4M12 9l-4 4M5 3h14"></path>
                          </svg>
                          <span class="bay-code">{{ elem.codigo }}</span>
                          <span class="bay-meta">{{ elem.seccion }}</span>
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

                      @if (elem.rotacion) {
                        <span class="mono absolute right-1 top-1 z-[2] rounded-sm bg-void/70 px-1 text-[0.42rem] text-mist/80">{{ elem.rotacion }}°</span>
                      }
                    </div>
                  }

                  <!-- Tirador de rotación -->
                  @if (seleccionado(); as sel) {
                    <div
                      class="absolute z-40 flex flex-col items-center"
                      [style.left.px]="sel.posX + anchoDe(sel) / 2 - 14"
                      [style.top.px]="sel.posY - 44"
                    >
                      <button
                        type="button"
                        (pointerdown)="iniciarRotacion($event, sel)"
                        (click)="$event.stopPropagation()"
                        class="grid h-7 w-7 place-items-center rounded-full border border-signal/60 bg-void text-signal shadow-[0_0_18px_-2px_rgba(203,213,225,0.45)] transition-transform hover:scale-110"
                        title="Arrastra para girar"
                      >
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"></path>
                        </svg>
                      </button>
                      <span class="h-3.5 w-px bg-signal/60"></span>
                    </div>

                    <!-- Acciones rápidas flotantes -->
                    <div
                      class="absolute z-40 flex items-center gap-1 rounded-md border border-edge bg-void/95 p-1 shadow-xl backdrop-blur"
                      [style.left.px]="sel.posX + anchoDe(sel) / 2 - 58"
                      [style.top.px]="sel.posY + altoDe(sel) + 10"
                    >
                      <button type="button" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation(); girarElemento(sel, -15)" class="grid h-6 w-6 place-items-center rounded text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk" title="Girar -15°">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v5h5M4.6 12a8 8 0 1 0 2-5.7"></path></svg>
                      </button>
                      <button type="button" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation(); girarElemento(sel, 15)" class="grid h-6 w-6 place-items-center rounded text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk" title="Girar +15°">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7v5h-5M19.4 12a8 8 0 1 1-2-5.7"></path></svg>
                      </button>
                      <span class="h-4 w-px bg-edge"></span>
                      <button type="button" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation(); duplicarElemento(sel)" class="grid h-6 w-6 place-items-center rounded text-mist transition-colors hover:bg-white/[0.06] hover:text-flow" title="Duplicar (Ctrl+D)">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="1.5" stroke-width="1.8"></rect><path stroke-width="1.8" d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path></svg>
                      </button>
                      <button type="button" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation(); eliminarElemento(sel)" class="grid h-6 w-6 place-items-center rounded text-mist transition-colors hover:bg-danger/15 hover:text-danger" title="Eliminar (Supr)">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5"></path></svg>
                      </button>
                    </div>
                  }

                  <!-- Estado vacío -->
                  @if (elementos().length === 0) {
                    <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
                      <div class="notch-sm grid h-14 w-14 place-items-center border border-signal/25 bg-signal/[0.06] text-signal">
                        <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="4" y="4" width="16" height="16" rx="2" stroke-width="1.5"></rect>
                          <path stroke-linecap="round" stroke-width="1.5" d="M12 8v8M8 12h8"></path>
                        </svg>
                      </div>
                      <h2 class="mt-4 text-base font-semibold text-chalk">El lienzo está vacío</h2>
                      <p class="mt-1 max-w-xs text-[0.68rem] leading-relaxed text-mist">
                        Selecciona una herramienta y haz clic aquí, o genera una fila de puestos para empezar.
                      </p>
                      <button type="button" (click)="$event.stopPropagation(); generarFila('A', 6)" class="btn btn-signal pointer-events-auto mt-4">
                        Generar fila de 6
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Badge de herramienta activa -->
            @if (herramienta() !== 'select') {
              <div class="pointer-events-none sticky bottom-3 left-1/2 z-30 mx-auto flex w-fit -translate-y-1 items-center gap-2 rounded-full border border-signal/35 bg-void/90 px-3 py-1.5 text-[0.6rem] text-signal shadow-xl backdrop-blur">
                <span class="h-1.5 w-1.5 rounded-full bg-signal"></span>
                Colocando {{ tipoEtiqueta(herramienta()) }} · Esc para salir
              </div>
            }
            </div>

            <!-- Controles de la capa satelital -->
            @if (satelite()) {
              <div class="absolute left-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 rounded-md border border-edge bg-void/90 p-1.5 shadow-xl backdrop-blur">
                <button
                  type="button"
                  (click)="alternarModoSatelite()"
                  class="mono inline-flex h-7 items-center gap-1.5 rounded px-2 text-[0.55rem] uppercase tracking-[0.1em] transition-colors"
                  [ngClass]="moverSatelite() ? 'bg-signal/15 text-signal' : 'text-mist hover:bg-white/[0.05] hover:text-chalk'"
                  title="Mover y hacer zoom en el mapa satelital"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v5a5 5 0 0 1-5 5h-1.6a4 4 0 0 1-3.1-1.5L4.5 15a1.6 1.6 0 0 1 2.5-2l1 1.3Z"></path>
                  </svg>
                  Mover
                </button>

                <span class="mx-0.5 h-4 w-px bg-edge"></span>

                <button type="button" (click)="zoomSatelite(1)" class="grid h-7 w-7 place-items-center rounded text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk" title="Acercar (satélite y plano)">+</button>
                <button type="button" (click)="zoomSatelite(-1)" class="grid h-7 w-7 place-items-center rounded text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk" title="Alejar (satélite y plano)">−</button>

                <span class="mx-0.5 h-4 w-px bg-edge"></span>

                <button type="button" (click)="centrarSateliteEnPin()" class="mono inline-flex h-7 items-center rounded px-2 text-[0.55rem] uppercase tracking-[0.1em] text-mist transition-colors hover:bg-white/[0.06] hover:text-chalk" title="Centrar en el pin guardado">Centrar pin</button>

                <button type="button" (click)="guardarPinSatelite()" [disabled]="!puedeEditar()" class="btn btn-signal h-7 px-2.5 text-[0.55rem]" title="Guardar el centro actual del mapa como pin de la sede">
                  {{ sateliteTienePin() ? 'Actualizar pin' : 'Guardar pin' }}
                </button>
              </div>

              @if (!sateliteTienePin()) {
                <div class="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-warn/35 bg-void/90 px-3 py-1.5 text-center text-[0.6rem] text-warn shadow-xl backdrop-blur">
                  Esta sede no tiene pin guardado. Activa «Mover», ubica el mapa y pulsa «Guardar pin».
                </div>
              }
            }
          </div>
        </section>
        </div>

        <!-- Inspector -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          @if (seleccionado(); as sel) {
            <div class="panel overflow-hidden">
              <div class="flex items-center justify-between border-b border-edge px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 rounded-full" [ngClass]="tipoMeta(sel.tipo).dot"></span>
                  <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">Elemento seleccionado</span>
                </div>
                <button type="button" (click)="deseleccionar()" class="text-mist transition-colors hover:text-chalk" title="Deseleccionar">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M18 6 6 18"></path>
                  </svg>
                </button>
              </div>

              <div class="space-y-4 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-semibold leading-none tracking-tight text-chalk">{{ sel.codigo }}</div>
                    <div class="mono mt-1 text-[0.5rem] uppercase tracking-[0.14em] text-mist">{{ tipoMeta(sel.tipo).label }} · {{ sel.seccion }}</div>
                  </div>
                  @if (esPuesto(sel.tipo)) {
                    <span class="tag" [ngClass]="sel.estado === 'libre' ? 'tag-ok' : 'tag-danger'">{{ sel.estado }}</span>
                  }
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                  <div>
                    <label class="label">Código</label>
                    <input
                      type="text"
                      class="field field-mono uppercase"
                      [ngModel]="sel.codigo"
                      (ngModelChange)="actualizarTexto('codigo', $event)"
                    />
                  </div>
                  <div>
                    <label class="label">Zona</label>
                    <input
                      type="text"
                      class="field"
                      [ngModel]="sel.seccion"
                      (ngModelChange)="actualizarTexto('seccion', $event)"
                    />
                  </div>
                </div>

                <div>
                  <label class="label">Tipo de elemento</label>
                  <select class="field" [ngModel]="sel.tipo" (ngModelChange)="cambiarTipo($event)">
                    @for (t of tipos; track t.id) {
                      <option [value]="t.id">{{ t.label }}</option>
                    }
                  </select>
                </div>

                <div class="border-t border-edge pt-4">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="label mb-0">Rotación</span>
                    <span class="mono text-[0.7rem] font-semibold text-signal">{{ sel.rotacion }}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    step="1"
                    class="range"
                    [ngModel]="sel.rotacion"
                    (ngModelChange)="actualizarRotacion($event)"
                  />
                  <div class="mt-2.5 grid grid-cols-4 gap-1.5">
                    @for (ang of [0, 90, 180, 270]; track ang) {
                      <button
                        type="button"
                        (click)="fijarRotacion(sel, ang)"
                        class="mono rounded border py-1.5 text-[0.55rem] transition-colors"
                        [ngClass]="sel.rotacion === ang ? 'border-signal/45 bg-signal/[0.08] text-signal' : 'border-edge text-mist hover:border-edge-strong hover:text-chalk'"
                      >
                        {{ ang }}°
                      </button>
                    }
                  </div>
                  <div class="mt-1.5 grid grid-cols-2 gap-1.5">
                    <button type="button" (click)="girarElemento(sel, -15)" class="btn btn-ghost h-7 text-[0.55rem]">−15°</button>
                    <button type="button" (click)="girarElemento(sel, 15)" class="btn btn-ghost h-7 text-[0.55rem]">+15°</button>
                  </div>
                </div>

                <div class="border-t border-edge pt-4">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="label mb-0">Posición</span>
                    <button type="button" (click)="centrarElemento(sel)" class="mono text-[0.52rem] uppercase tracking-[0.1em] text-mist transition-colors hover:text-signal">Centrar</button>
                  </div>
                  <div class="grid grid-cols-2 gap-2.5">
                    <div class="relative">
                      <span class="mono pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[0.52rem] text-mist/60">X</span>
                      <input type="number" class="field field-mono pl-6 text-[0.68rem]" [ngModel]="sel.posX" (ngModelChange)="actualizarPosicion('posX', $event)" />
                    </div>
                    <div class="relative">
                      <span class="mono pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[0.52rem] text-mist/60">Y</span>
                      <input type="number" class="field field-mono pl-6 text-[0.68rem]" [ngModel]="sel.posY" (ngModelChange)="actualizarPosicion('posY', $event)" />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 border-t border-edge pt-4">
                  <button type="button" (click)="duplicarElemento(sel)" class="btn btn-ghost h-8 text-[0.6rem]">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="8" y="8" width="12" height="12" rx="1.5" stroke-width="1.8"></rect>
                      <path stroke-width="1.8" d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path>
                    </svg>
                    Duplicar
                  </button>
                  <button type="button" (click)="eliminarElemento(sel)" class="btn btn-danger h-8 text-[0.6rem]">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="panel p-5 text-center">
              <div class="notch-sm mx-auto grid h-11 w-11 place-items-center border border-edge bg-white/[0.02] text-mist">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="m5 4 14 6-6 2-2 6-6-14Z"></path>
                </svg>
              </div>
              <h2 class="mt-3 text-sm font-semibold text-chalk">Selecciona un elemento</h2>
              <p class="mt-1 text-[0.65rem] leading-relaxed text-mist">
                Haz clic en una casilla, entrada o carril para editar su código, rotación y posición exacta.
              </p>
            </div>
          }

          <!-- Leyenda / capas -->
          <div class="panel p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="mono text-[0.54rem] uppercase tracking-[0.16em] text-chalk">Capas del plano</span>
              <span class="mono text-[0.5rem] text-mist">{{ elementos().length }} total</span>
            </div>
            <div class="space-y-1.5">
              @for (t of tipos; track t.id) {
                <div class="flex items-center justify-between rounded border border-transparent px-1.5 py-1 text-[0.62rem] text-mist transition-colors hover:border-edge hover:bg-white/[0.02]">
                  <span class="flex items-center gap-2">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="t.dot"></span>
                    {{ t.label }}
                  </span>
                  <span class="mono text-chalk">{{ conteos()[t.id] }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Atajos -->
          <div class="panel-flat p-4">
            <div class="mb-2.5 flex items-center gap-2">
              <svg class="h-3.5 w-3.5 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="1.6"></circle>
                <path stroke-linecap="round" stroke-width="1.6" d="M12 11v5m0-8.5v.01"></path>
              </svg>
              <span class="mono text-[0.52rem] uppercase tracking-[0.16em] text-mist">Atajos del editor</span>
            </div>
            <div class="space-y-1.5 text-[0.6rem] text-mist">
              <div class="flex items-center justify-between"><span>Mover 10 px</span><span class="flex gap-1"><kbd class="node-key">←</kbd><kbd class="node-key">↑</kbd><kbd class="node-key">↓</kbd><kbd class="node-key">→</kbd></span></div>
              <div class="flex items-center justify-between"><span>Mover 1 px</span><span class="flex gap-1"><kbd class="node-key">Shift</kbd><span class="self-center text-mist/50">+</span><kbd class="node-key">←</kbd></span></div>
              <div class="flex items-center justify-between"><span>Girar 15°</span><kbd class="node-key">R</kbd></div>
              <div class="flex items-center justify-between"><span>Duplicar</span><span class="flex items-center gap-1"><kbd class="node-key">Ctrl</kbd><kbd class="node-key">D</kbd></span></div>
              <div class="flex items-center justify-between"><span>Eliminar</span><kbd class="node-key">Supr</kbd></div>
              <div class="flex items-center justify-between"><span>Guardar</span><span class="flex items-center gap-1"><kbd class="node-key">Ctrl</kbd><kbd class="node-key">S</kbd></span></div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  `
})
export class DisenadorMapaComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private casillaService = inject(CasillaService);
  private organizacionService = inject(OrganizacionService);
  private authService = inject(AuthService);

  readonly ANCHO = 1200;
  readonly ALTO = 720;

  /** Marco visible del lienzo; se usa para calcular el zoom que lo hace encajar. */
  private marcoPlanoEl: HTMLElement | null = null;
  private observadorMarco?: ResizeObserver;
  private zoomManual = false;

  @ViewChild('marcoPlano')
  set marcoPlano(ref: ElementRef<HTMLElement> | undefined) {
    this.observadorMarco?.disconnect();
    this.marcoPlanoEl = ref?.nativeElement ?? null;
    if (!this.marcoPlanoEl) return;

    this.observadorMarco = new ResizeObserver(() => this.ajustarZoomAlMarco());
    this.observadorMarco.observe(this.marcoPlanoEl);
    this.ajustarZoomAlMarco();
  }

  /**
   * El satélite se dibuja al doble de resolución y se contrapica al 50%.
   * Así se mantiene nítido cuando el lienzo se escala (40%–150%) sin
   * alterar su escala real respecto a las casillas.
   */
  private readonly ZOOM_SATELITE = 19;

  organizacionId = signal<string>('');
  organizacion = signal<Organizacion | null>(null);
  elementos = signal<ElementoDiseno[]>([]);
  seleccionadoId = signal<string | null>(null);

  herramienta = signal<TipoElemento | 'select'>('select');
  zoom = signal<number>(0.7);
  snap = signal<boolean>(true);
  mostrarGrilla = signal<boolean>(true);
  satelite = signal<boolean>(false);
  moverSatelite = signal<boolean>(false);
  sateliteTienePin = signal<boolean>(false);
  cursorPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  guardando = signal<boolean>(false);
  hayCambios = signal<boolean>(false);
  feedback = signal<Feedback | null>(null);

  /** Solo el creador de la sede puede modificar su plano. */
  puedeEditar = computed(() => {
    const org = this.organizacion();
    const usuario = this.authService.currentUser();
    if (!org || !usuario) return true;
    return org.creadoPor === usuario._id;
  });

  tipos: Array<{ id: TipoElemento; label: string; dot: string }> = [
    { id: 'standard', label: 'Estándar', dot: 'bg-ok' },
    { id: 'discapacitados', label: 'Movilidad', dot: 'bg-flow' },
    { id: 'electrico', label: 'Eléctrico', dot: 'bg-warn' },
    { id: 'entrada', label: 'Entrada', dot: 'bg-ok' },
    { id: 'salida', label: 'Salida', dot: 'bg-danger' },
    { id: 'carril', label: 'Carril', dot: 'bg-mist' }
  ];

  seleccionado = computed(() => {
    const id = this.seleccionadoId();
    return id ? this.elementos().find((e) => e.uid === id) ?? null : null;
  });

  conteos = computed<Record<TipoElemento, number>>(() => {
    const base: Record<TipoElemento, number> = {
      standard: 0,
      discapacitados: 0,
      electrico: 0,
      entrada: 0,
      salida: 0,
      carril: 0
    };
    for (const elem of this.elementos()) base[elem.tipo]++;
    return base;
  });

  libresCount = computed(() => this.elementos().filter((e) => this.esPuesto(e.tipo) && e.estado === 'libre').length);
  ocupadasCount = computed(() => this.elementos().filter((e) => this.esPuesto(e.tipo) && e.estado === 'ocupado').length);
  zoomPorcentaje = computed(() => Math.round(this.zoom() * 100));

  private modo: 'mover' | 'rotar' | null = null;
  private uidActivo = '';
  private punteroInicio = { x: 0, y: 0 };
  private posicionInicial = { x: 0, y: 0 };
  private rotacionInicial = 0;
  private anguloInicial = 0;
  private centroRotacion = { x: 0, y: 0 };
  private huboMovimiento = false;
  private suprimirClickHasta = 0;
  private mapaSatelite: L.Map | null = null;
  private marcadorSatelite: L.CircleMarker | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.organizacionId.set(id);
      this.cargarOrganizacion(id);
      this.cargarCasillas(id);
    }

    window.addEventListener('pointermove', this.alMoverGlobal);
    window.addEventListener('pointerup', this.alSoltarGlobal);
    window.addEventListener('keydown', this.alPresionarTecla);
  }

  ngOnDestroy(): void {
    this.observadorMarco?.disconnect();
    window.removeEventListener('pointermove', this.alMoverGlobal);
    window.removeEventListener('pointerup', this.alSoltarGlobal);
    window.removeEventListener('keydown', this.alPresionarTecla);
    this.destruirMapaSatelite();
  }

  // ── Carga ────────────────────────────────────────────────────────
  cargarOrganizacion(id: string): void {
    this.organizacionService.misOrganizaciones().subscribe((orgs) => {
      const match = orgs.find((o) => o._id === id);
      if (match) {
        this.organizacion.set(match);

        // Si la vista satélite ya está abierta, se recentra en el pin real.
        this.sincronizarPinSatelite(match);
      }
    });
  }

  cargarCasillas(orgId: string): void {
    this.casillaService.listarPorOrganizacion(orgId).subscribe({
      next: (data) => {
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

        const elems: ElementoDiseno[] = data.map((c: Casilla, i) => {
          let posX = typeof c.posX === 'number' ? c.posX : 0;
          let posY = typeof c.posY === 'number' ? c.posY : 0;

          const sinUbicacion = (posX === 0 && posY === 0) || ocupadas.has(`${posX},${posY}`);
          if (sinUbicacion) {
            const pos = siguienteAuto();
            posX = pos.x;
            posY = pos.y;
          }

          posX = Math.max(0, Math.min(posX, this.ANCHO - this.anchoTipo(c.tipo)));
          posY = Math.max(0, Math.min(posY, this.ALTO - this.altoTipo(c.tipo)));
          ocupadas.add(`${posX},${posY}`);

          return {
            uid: c._id || `el-${i}-${Math.random().toString(36).slice(2, 7)}`,
            _id: c._id,
            codigo: c.codigo,
            seccion: c.seccion || 'Sección A',
            tipo: (c.tipo as TipoElemento) || 'standard',
            estado: c.estado || 'libre',
            posX,
            posY,
            rotacion: c.rotacion || 0,
            esNuevo: false
          };
        });

        this.elementos.set(elems);
        this.seleccionadoId.set(null);
        this.hayCambios.set(false);
      },
      error: () => {
        this.elementos.set([]);
        this.feedback.set({ tipo: 'error', texto: 'No se pudieron cargar las casillas de esta sede.' });
      }
    });
  }

  // ── Vista satélite ───────────────────────────────────────────────
  alternarSatelite(): void {
    if (this.satelite()) {
      this.satelite.set(false);
      this.moverSatelite.set(false);
      this.destruirMapaSatelite();
      return;
    }

    this.satelite.set(true);
    // Se espera al siguiente ciclo para que el contenedor ya exista.
    setTimeout(() => this.iniciarMapaSatelite(), 30);
  }

  /** Activa o desactiva el arrastre del mapa sin bloquear el dibujo. */
  alternarModoSatelite(): void {
    this.moverSatelite.update((activo) => !activo);
    this.aplicarModoSatelite();
  }

  zoomSatelite(delta: number): void {
    // El zoom mueve todo el lienzo para no perder la escala entre el
    // satélite y las casillas. El mapa en sí mantiene su zoom de render.
    this.cambiarZoom(delta * 0.1);
  }

  centrarSateliteEnPin(): void {
    const org = this.organizacion();
    if (typeof org?.latitud === 'number' && typeof org?.longitud === 'number') {
      this.mapaSatelite?.setView([org.latitud, org.longitud], this.ZOOM_SATELITE);
      this.marcadorSatelite?.setLatLng([org.latitud, org.longitud]);
      return;
    }

    this.feedback.set({
      tipo: 'warn',
      texto: 'Esta sede todavía no tiene un pin guardado. Activa «Mover», ubica el mapa en la dirección real y pulsa «Guardar pin».'
    });
  }

  /** Guarda el centro actual del mapa como pin de la sede. */
  guardarPinSatelite(): void {
    const org = this.organizacion();
    const mapa = this.mapaSatelite;
    if (!org || !mapa) return;

    if (!this.puedeEditar()) {
      this.feedback.set({ tipo: 'warn', texto: 'Solo el creador de la sede puede guardar su ubicación.' });
      return;
    }

    const centro = mapa.getCenter();
    const latitud = Number(centro.lat.toFixed(6));
    const longitud = Number(centro.lng.toFixed(6));

    this.organizacionService.editarOrganizacion(org._id, { latitud, longitud }).subscribe({
      next: () => {
        const actualizada = { ...org, latitud, longitud };
        this.organizacion.set(actualizada);
        this.sateliteTienePin.set(true);
        this.marcadorSatelite?.setLatLng([latitud, longitud]);
        this.feedback.set({
          tipo: 'ok',
          texto: `Pin guardado en ${latitud}, ${longitud}. La vista satélite ya abre centrada ahí.`
        });
      },
      error: (err) => {
        this.feedback.set({
          tipo: 'error',
          texto: err.error?.message || 'No se pudo guardar el pin de la sede.'
        });
      }
    });
  }

  private iniciarMapaSatelite(): void {
    if (!this.satelite()) return;
    this.destruirMapaSatelite();

    const contenedor = document.getElementById('mapa-satelite-plano');
    if (!contenedor) return;

    const org = this.organizacion();
    const tienePin = typeof org?.latitud === 'number' && typeof org?.longitud === 'number';
    const lat = tienePin ? (org!.latitud as number) : 6.172;
    const lng = tienePin ? (org!.longitud as number) : -75.609;
    this.sateliteTienePin.set(tienePin);

    this.mapaSatelite = L.map(contenedor, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false
    }).setView([lat, lng], this.ZOOM_SATELITE);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    }).addTo(this.mapaSatelite);

    this.marcadorSatelite = L.circleMarker([lat, lng], {
      radius: 14,
      color: '#ffffff',
      weight: 4,
      fillColor: '#5d8bff',
      fillOpacity: 0.95
    }).addTo(this.mapaSatelite);

    this.aplicarModoSatelite();
    setTimeout(() => this.mapaSatelite?.invalidateSize(), 120);

    // Las sedes antiguas no guardaron el pin: se intenta ubicar por la dirección.
    if (!tienePin && org?.direccion) {
      this.ubicarSatelitePorDireccion(org.direccion);
    }
  }

  private aplicarModoSatelite(): void {
    const mapa = this.mapaSatelite;
    if (!mapa) return;

    if (this.moverSatelite()) {
      mapa.dragging.enable();
    } else {
      mapa.dragging.disable();
    }
  }

  /** Recentra el mapa cuando la organización termina de cargar. */
  private sincronizarPinSatelite(org: Organizacion): void {
    if (!this.mapaSatelite) return;

    if (typeof org.latitud === 'number' && typeof org.longitud === 'number') {
      this.sateliteTienePin.set(true);
      this.mapaSatelite.setView([org.latitud, org.longitud], this.ZOOM_SATELITE);
      this.marcadorSatelite?.setLatLng([org.latitud, org.longitud]);
      return;
    }

    // La organización cargó después de abrir el mapa y no tiene pin guardado.
    this.sateliteTienePin.set(false);
    if (org.direccion) this.ubicarSatelitePorDireccion(org.direccion);
  }

  private ubicarSatelitePorDireccion(direccion: string): void {
    const consulta = direccion.trim();
    if (!consulta) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(consulta)}`)
      .then((res) => res.json())
      .then((lista: Array<{ lat: string; lon: string }>) => {
        if (!this.satelite() || !this.mapaSatelite || !lista?.length) return;
        const lat = Number.parseFloat(lista[0].lat);
        const lng = Number.parseFloat(lista[0].lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        this.mapaSatelite.setView([lat, lng], this.ZOOM_SATELITE);
        this.marcadorSatelite?.setLatLng([lat, lng]);
      })
      .catch(() => {});
  }

  private destruirMapaSatelite(): void {
    this.mapaSatelite?.remove();
    this.mapaSatelite = null;
    this.marcadorSatelite = null;
  }

  // ── Añadir / duplicar / eliminar ─────────────────────────────────
  seleccionarHerramienta(tipo: TipoElemento | 'select'): void {
    this.herramienta.set(tipo);
    if (tipo === 'select') {
      this.feedback.set(null);
    }
  }

  agregarElemento(tipo: TipoElemento): void {
    const pos = this.posicionLibre();
    const nuevo = this.crearElemento(tipo, pos.x, pos.y);
    this.elementos.update((lista) => [...lista, nuevo]);
    this.seleccionadoId.set(nuevo.uid);
    this.hayCambios.set(true);
    this.herramienta.set(tipo);
  }

  generarFila(letra: string, cantidad: number): void {
    const nuevos: ElementoDiseno[] = [];
    for (let i = 0; i < cantidad; i++) {
      const pos = this.posicionLibre();
      const nuevo = this.crearElemento('standard', pos.x, pos.y);
      nuevo.seccion = `Sección ${letra}`;
      nuevos.push(nuevo);
      this.elementos.update((lista) => [...lista, nuevo]);
    }
    if (nuevos.length > 0) {
      this.seleccionadoId.set(nuevos[nuevos.length - 1].uid);
      this.hayCambios.set(true);
      this.feedback.set({ tipo: 'ok', texto: `Se agregaron ${cantidad} casillas a la Sección ${letra}.` });
    }
  }

  duplicarElemento(elem: ElementoDiseno): void {
    const copia: ElementoDiseno = {
      ...elem,
      uid: this.nuevoUid(),
      _id: undefined,
      codigo: this.siguienteCodigo(elem.tipo),
      posX: Math.min(elem.posX + 26, this.ANCHO - this.anchoDe(elem)),
      posY: Math.min(elem.posY + 26, this.ALTO - this.altoDe(elem)),
      esNuevo: true
    };
    this.elementos.update((lista) => [...lista, copia]);
    this.seleccionadoId.set(copia.uid);
    this.hayCambios.set(true);
    this.feedback.set({ tipo: 'ok', texto: `Elemento duplicado como ${copia.codigo}.` });
  }

  eliminarElemento(elem: ElementoDiseno): void {
    if (this.removiendo) return;

    const quitar = () => {
      this.elementos.update((lista) => lista.filter((e) => e.uid !== elem.uid));
      if (this.seleccionadoId() === elem.uid) this.seleccionadoId.set(null);
      this.hayCambios.set(true);
      this.feedback.set({ tipo: 'ok', texto: `Elemento ${elem.codigo} eliminado del plano.` });
    };

    if (!elem._id) {
      quitar();
      return;
    }

    this.removiendo = true;
    this.casillaService.eliminarCasilla(elem._id).subscribe({
      next: () => {
        this.removiendo = false;
        quitar();
      },
      error: (err) => {
        this.removiendo = false;
        this.feedback.set({ tipo: 'error', texto: err.error?.message || `No se pudo eliminar ${elem.codigo}.` });
      }
    });
  }

  private removiendo = false;

  // ── Interacción en el lienzo ─────────────────────────────────────
  alClickLienzo(event: MouseEvent): void {
    // Un arrastre o giro no debe convertirse en un clic de creación.
    if (this.consumirClickSuprimido()) return;

    // Mientras se mueve el satélite, el clic pertenece al mapa.
    if (this.satelite() && this.moverSatelite()) return;

    const tipo = this.herramienta();
    if (tipo === 'select') {
      this.deseleccionar();
      return;
    }

    const superficie = this.superficie();
    if (!superficie) return;

    const rect = superficie.getBoundingClientRect();
    const zoom = this.zoom();
    const ancho = this.anchoTipo(tipo);
    const alto = this.altoTipo(tipo);

    let posX = (event.clientX - rect.left) / zoom - ancho / 2;
    let posY = (event.clientY - rect.top) / zoom - alto / 2;

    if (this.snap()) {
      posX = Math.round(posX / 10) * 10;
      posY = Math.round(posY / 10) * 10;
    }

    posX = Math.max(0, Math.min(posX, this.ANCHO - ancho));
    posY = Math.max(0, Math.min(posY, this.ALTO - alto));

    const nuevo = this.crearElemento(tipo, posX, posY);
    this.elementos.update((lista) => [...lista, nuevo]);
    this.seleccionadoId.set(nuevo.uid);
    this.hayCambios.set(true);
    this.feedback.set(null);
  }

  alMoverSobreLienzo(event: PointerEvent): void {
    const superficie = this.superficie();
    if (!superficie) return;
    const rect = superficie.getBoundingClientRect();
    const zoom = this.zoom();
    this.cursorPos.set({
      x: Math.max(0, Math.round((event.clientX - rect.left) / zoom)),
      y: Math.max(0, Math.round((event.clientY - rect.top) / zoom))
    });
  }

  seleccionarElemento(elem: ElementoDiseno): void {
    // Evita que al soltar el puntero quede seleccionado otro elemento.
    if (this.consumirClickSuprimido()) return;
    this.seleccionadoId.set(elem.uid);
  }

  deseleccionar(): void {
    this.seleccionadoId.set(null);
  }

  iniciarArrastre(event: PointerEvent, elem: ElementoDiseno): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    this.seleccionadoId.set(elem.uid);
    this.modo = 'mover';
    this.uidActivo = elem.uid;
    this.punteroInicio = { x: event.clientX, y: event.clientY };
    this.posicionInicial = { x: elem.posX, y: elem.posY };
    this.huboMovimiento = false;
  }

  iniciarRotacion(event: PointerEvent, elem: ElementoDiseno): void {
    event.preventDefault();
    event.stopPropagation();

    const superficie = this.superficie();
    if (!superficie) return;

    const rect = superficie.getBoundingClientRect();
    const zoom = this.zoom();
    const centroX = rect.left + (elem.posX + this.anchoDe(elem) / 2) * zoom;
    const centroY = rect.top + (elem.posY + this.altoDe(elem) / 2) * zoom;

    this.seleccionadoId.set(elem.uid);
    this.modo = 'rotar';
    this.uidActivo = elem.uid;
    this.centroRotacion = { x: centroX, y: centroY };
    this.anguloInicial = (Math.atan2(event.clientY - centroY, event.clientX - centroX) * 180) / Math.PI;
    this.rotacionInicial = elem.rotacion || 0;
    this.huboMovimiento = false;
  }

  private alMoverGlobal = (event: PointerEvent): void => {
    if (!this.modo) return;

    const elem = this.elementos().find((e) => e.uid === this.uidActivo);
    if (!elem) return;

    if (this.modo === 'mover') {
      const zoom = this.zoom();
      let posX = this.posicionInicial.x + (event.clientX - this.punteroInicio.x) / zoom;
      let posY = this.posicionInicial.y + (event.clientY - this.punteroInicio.y) / zoom;

      if (this.snap()) {
        posX = Math.round(posX / 10) * 10;
        posY = Math.round(posY / 10) * 10;
      }

      posX = Math.max(0, Math.min(posX, this.ANCHO - this.anchoDe(elem)));
      posY = Math.max(0, Math.min(posY, this.ALTO - this.altoDe(elem)));

      if (posX !== elem.posX || posY !== elem.posY) {
        this.actualizarElemento(elem.uid, { posX, posY });
        this.huboMovimiento = true;
      }
    } else {
      const anguloActual = (Math.atan2(event.clientY - this.centroRotacion.y, event.clientX - this.centroRotacion.x) * 180) / Math.PI;
      let nueva = this.rotacionInicial + (anguloActual - this.anguloInicial);
      if (event.shiftKey) nueva = Math.round(nueva / 15) * 15;
      nueva = ((Math.round(nueva) % 360) + 360) % 360;

      if (nueva !== elem.rotacion) {
        this.actualizarElemento(elem.uid, { rotacion: nueva });
        this.huboMovimiento = true;
      }
    }
  };

  private alSoltarGlobal = (): void => {
    if (this.modo && this.huboMovimiento) {
      this.hayCambios.set(true);
      // El clic se dispara después de pointerup. Se ignora para que el
      // elemento seleccionado no cambie al soltar el puntero.
      this.suprimirClickHasta = performance.now() + 350;
    }
    this.modo = null;
    this.uidActivo = '';
    this.huboMovimiento = false;
  };

  private consumirClickSuprimido(): boolean {
    if (performance.now() < this.suprimirClickHasta) {
      this.suprimirClickHasta = 0;
      return true;
    }
    return false;
  }

  private alPresionarTecla = (event: KeyboardEvent): void => {
    const objetivo = event.target as HTMLElement | null;
    if (objetivo && (['INPUT', 'TEXTAREA', 'SELECT'].includes(objetivo.tagName) || objetivo.isContentEditable)) return;

    if (event.key === 'Escape') {
      this.herramienta.set('select');
      this.deseleccionar();
      return;
    }

    const sel = this.seleccionado();
    if (!sel) return;

    if (event.ctrlKey || event.metaKey) {
      const tecla = event.key.toLowerCase();
      if (tecla === 'd') {
        event.preventDefault();
        this.duplicarElemento(sel);
      } else if (tecla === 's') {
        event.preventDefault();
        this.guardarDiseno();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        const paso = event.shiftKey ? 1 : 10;
        const dx = event.key === 'ArrowLeft' ? -paso : event.key === 'ArrowRight' ? paso : 0;
        const dy = event.key === 'ArrowUp' ? -paso : event.key === 'ArrowDown' ? paso : 0;
        this.moverElemento(sel, dx, dy);
        break;
      }
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.eliminarElemento(sel);
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        this.girarElemento(sel, event.shiftKey ? -15 : 15);
        break;
    }
  };

  // ── Edición de propiedades ───────────────────────────────────────
  actualizarElemento(uid: string, cambios: Partial<ElementoDiseno>): void {
    this.elementos.update((lista) => lista.map((e) => (e.uid === uid ? { ...e, ...cambios } : e)));
  }

  actualizarTexto(campo: 'codigo' | 'seccion', valor: string): void {
    const sel = this.seleccionado();
    if (!sel) return;
    this.actualizarElemento(sel.uid, { [campo]: valor } as Partial<ElementoDiseno>);
    this.hayCambios.set(true);
  }

  cambiarTipo(tipo: TipoElemento): void {
    const sel = this.seleccionado();
    if (!sel) return;
    const posX = Math.max(0, Math.min(sel.posX, this.ANCHO - this.anchoTipo(tipo)));
    const posY = Math.max(0, Math.min(sel.posY, this.ALTO - this.altoTipo(tipo)));
    this.actualizarElemento(sel.uid, { tipo, posX, posY });
    this.hayCambios.set(true);
  }

  actualizarRotacion(valor: string | number): void {
    const sel = this.seleccionado();
    if (!sel) return;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return;
    this.actualizarElemento(sel.uid, { rotacion: ((Math.round(numero) % 360) + 360) % 360 });
    this.hayCambios.set(true);
  }

  fijarRotacion(elem: ElementoDiseno, grados: number): void {
    this.actualizarElemento(elem.uid, { rotacion: ((grados % 360) + 360) % 360 });
    this.hayCambios.set(true);
  }

  girarElemento(elem: ElementoDiseno, grados: number): void {
    const rotacion = (((elem.rotacion || 0) + grados) % 360 + 360) % 360;
    this.actualizarElemento(elem.uid, { rotacion });
    this.hayCambios.set(true);
  }

  actualizarPosicion(campo: 'posX' | 'posY', valor: string | number): void {
    const sel = this.seleccionado();
    if (!sel) return;
    const numero = Number(valor);
    if (Number.isNaN(numero)) return;
    const limite = campo === 'posX' ? this.ANCHO - this.anchoDe(sel) : this.ALTO - this.altoDe(sel);
    this.actualizarElemento(sel.uid, { [campo]: Math.max(0, Math.min(Math.round(numero), limite)) } as Partial<ElementoDiseno>);
    this.hayCambios.set(true);
  }

  centrarElemento(elem: ElementoDiseno): void {
    this.actualizarElemento(elem.uid, {
      posX: Math.round((this.ANCHO - this.anchoDe(elem)) / 2),
      posY: Math.round((this.ALTO - this.altoDe(elem)) / 2)
    });
    this.hayCambios.set(true);
  }

  private moverElemento(elem: ElementoDiseno, dx: number, dy: number): void {
    const posX = Math.max(0, Math.min(elem.posX + dx, this.ANCHO - this.anchoDe(elem)));
    const posY = Math.max(0, Math.min(elem.posY + dy, this.ALTO - this.altoDe(elem)));
    this.actualizarElemento(elem.uid, { posX, posY });
    this.hayCambios.set(true);
  }

  // ── Zoom ─────────────────────────────────────────────────────────
  cambiarZoom(delta: number): void {
    this.zoomManual = true;
    this.zoom.set(Math.max(0.15, Math.min(1.5, Number((this.zoom() + delta).toFixed(2)))));
  }

  resetZoom(): void {
    this.zoomManual = false;
    this.ajustarZoomAlMarco();
  }

  private ajustarZoomAlMarco(): void {
    if (this.zoomManual) return;

    const marco = this.marcoPlanoEl;
    if (!marco) return;

    const ancho = marco.clientWidth;
    const alto = marco.clientHeight;
    if (!ancho || !alto) return;

    // 1px de margen para evitar barras de desplazamiento por redondeo.
    const ajuste = Math.min((ancho - 1) / this.ANCHO, (alto - 1) / this.ALTO);
    this.zoom.set(Math.max(0.15, Math.min(1.5, Number(ajuste.toFixed(3)))));
  }

  // ── Guardar ──────────────────────────────────────────────────────
  guardarDiseno(): void {
    const orgId = this.organizacionId();
    if (!orgId || this.guardando()) return;

    const elems = this.elementos();
    if (elems.length === 0) {
      this.feedback.set({ tipo: 'warn', texto: 'El plano está vacío. Agrega al menos una casilla antes de guardar.' });
      return;
    }

    const codigoVacio = elems.find((e) => !e.codigo.trim() || !e.seccion.trim());
    if (codigoVacio) {
      this.feedback.set({ tipo: 'error', texto: 'Todos los elementos necesitan un código y una zona.' });
      this.seleccionadoId.set(codigoVacio.uid);
      return;
    }

    this.guardando.set(true);
    this.feedback.set(null);

    const solicitudes = elems.map((elem) => {
      const payload = {
        codigo: elem.codigo.trim(),
        seccion: elem.seccion.trim(),
        tipo: elem.tipo,
        posX: Math.round(elem.posX),
        posY: Math.round(elem.posY),
        rotacion: Math.round(elem.rotacion)
      };

      if (elem._id) {
        return this.casillaService.editarCasilla(elem._id, payload).pipe(
          map(() => ({ ok: true, uid: elem.uid, casilla: null as Casilla | null, error: null as string | null })),
          catchError((err) => of({ ok: false, uid: elem.uid, casilla: null as Casilla | null, error: this.mensajeError(err) }))
        );
      }

      return this.casillaService.crearCasilla({ organizacion: orgId, ...payload }).pipe(
        map((res: any) => ({ ok: true, uid: elem.uid, casilla: (res?.casilla ?? null) as Casilla | null, error: null as string | null })),
        catchError((err) => of({ ok: false, uid: elem.uid, casilla: null as Casilla | null, error: this.mensajeError(err) }))
      );
    });

    forkJoin(solicitudes).subscribe((resultados) => {
      const lista = [...this.elementos()];
      const fallos = resultados.filter((res) => !res.ok);

      resultados.forEach((res) => {
        if (!res.ok || !res.casilla) {
          return;
        }
        const indice = lista.findIndex((e) => e.uid === res.uid);
        if (indice >= 0) {
          lista[indice] = {
            ...lista[indice],
            _id: res.casilla._id,
            esNuevo: false,
            estado: (res.casilla.estado as 'libre' | 'ocupado') || lista[indice].estado
          };
        }
      });

      this.elementos.set(lista);

      if (fallos.length > 0) {
        this.guardando.set(false);
        const detalle = fallos[0].error || 'Error desconocido al guardar.';
        this.feedback.set({
          tipo: 'warn',
          texto: `${fallos.length} elemento(s) no se pudieron guardar. ${detalle}`
        });
        return;
      }

      this.sincronizarTotalPuestos(orgId, lista);
    });
  }

  /**
   * El plano es la fuente de verdad: al guardarlo, el total de puestos de la
   * sede se ajusta al número real de casillas de parqueo dibujadas.
   */
  private sincronizarTotalPuestos(orgId: string, lista: ElementoDiseno[]): void {
    const puestos = lista.filter((e) => this.esPuesto(e.tipo)).length;
    const org = this.organizacion();

    if (!org || org.totalPuestos === puestos) {
      this.finalizarGuardado();
      return;
    }

    this.organizacionService.editarOrganizacion(orgId, { totalPuestos: puestos }).subscribe({
      next: (res: any) => {
        this.organizacion.set(res?.organizacion ?? { ...org, totalPuestos: puestos });
        this.finalizarGuardado();
      },
      error: (err) => {
        // El plano sí quedó guardado; solo falló el contador de la sede.
        this.guardando.set(false);
        this.hayCambios.set(false);
        this.feedback.set({
          tipo: 'warn',
          texto: `Plano guardado, pero no se pudo actualizar el total de puestos: ${this.mensajeError(err)}`
        });
      }
    });
  }

  private finalizarGuardado(): void {
    this.guardando.set(false);
    this.hayCambios.set(false);
    this.feedback.set({ tipo: 'ok', texto: 'Plano guardado y sincronizado con la vista del conductor.' });
  }

  private mensajeError(err: any): string {
    return err?.error?.message || err?.message || 'Error desconocido al guardar.';
  }

  // ── Utilidades ───────────────────────────────────────────────────
  tipoMeta(tipo: TipoElemento): { id: TipoElemento; label: string; dot: string } {
    return this.tipos.find((t) => t.id === tipo) ?? this.tipos[0];
  }

  tipoEtiqueta(tipo: TipoElemento | 'select'): string {
    if (tipo === 'select') return 'selección';
    return this.tipoMeta(tipo).label.toLowerCase();
  }

  esPuesto(tipo: TipoElemento): boolean {
    return tipo === 'standard' || tipo === 'discapacitados' || tipo === 'electrico';
  }

  anchoDe(elem: ElementoDiseno): number {
    return this.anchoTipo(elem.tipo);
  }

  altoDe(elem: ElementoDiseno): number {
    return this.altoTipo(elem.tipo);
  }

  private anchoTipo(tipo: TipoElemento): number {
    if (tipo === 'carril') return 360;
    if (tipo === 'entrada' || tipo === 'salida') return 132;
    return 88;
  }

  private altoTipo(tipo: TipoElemento): number {
    if (tipo === 'carril') return 84;
    if (tipo === 'entrada' || tipo === 'salida') return 84;
    return 120;
  }

  private posicionLibre(): { x: number; y: number } {
    const ocupadas = new Set(this.elementos().map((e) => `${Math.round(e.posX / 10)},${Math.round(e.posY / 10)}`));
    for (let i = 0; i < 160; i++) {
      const col = i % 10;
      const fila = Math.floor(i / 10);
      const x = 70 + col * 105;
      const y = 70 + fila * 130;
      if (y > this.ALTO - 130) break;
      if (!ocupadas.has(`${Math.round(x / 10)},${Math.round(y / 10)}`)) return { x, y };
    }
    return { x: 70, y: 70 };
  }

  private crearElemento(tipo: TipoElemento, posX: number, posY: number): ElementoDiseno {
    const seccionPorTipo: Record<TipoElemento, string> = {
      standard: 'Sección A',
      discapacitados: 'Sección A',
      electrico: 'Sección A',
      entrada: 'Acceso',
      salida: 'Acceso',
      carril: 'Circulación'
    };

    return {
      uid: this.nuevoUid(),
      codigo: this.siguienteCodigo(tipo),
      seccion: seccionPorTipo[tipo],
      tipo,
      estado: 'libre',
      posX,
      posY,
      rotacion: 0,
      esNuevo: true
    };
  }

  private siguienteCodigo(tipo: TipoElemento): string {
    const prefix: Record<TipoElemento, string> = {
      standard: 'P',
      discapacitados: 'D',
      electrico: 'E',
      entrada: 'ENT',
      salida: 'SAL',
      carril: 'VIA'
    };
    const usados = new Set(this.elementos().map((e) => e.codigo.trim().toUpperCase()));
    let numero = 1;
    while (usados.has(`${prefix[tipo]}-${String(numero).padStart(2, '0')}`)) numero++;
    return `${prefix[tipo]}-${String(numero).padStart(2, '0')}`;
  }

  private nuevoUid(): string {
    return `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private superficie(): HTMLElement | null {
    return document.getElementById('plan-surface');
  }
}
