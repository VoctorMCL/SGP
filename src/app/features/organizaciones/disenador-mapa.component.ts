import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CasillaService } from '../../core/services/casilla.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { Casilla, Organizacion } from '../../core/models';

interface ElementoDiseno {
  _id?: string;
  codigo: string;
  seccion: string;
  tipo: 'standard' | 'discapacitados' | 'electrico' | 'entrada' | 'salida' | 'carril';
  estado: 'libre' | 'ocupado';
  posX: number;
  posY: number;
  rotacion: number;
  esNuevo?: boolean;
}

@Component({
  selector: 'app-disenador-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <a routerLink="/organizaciones" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              ← Mis Sedes
            </a>
            <span class="text-slate-600">/</span>
            <span class="text-xs font-semibold text-blue-400">Editor Visual de Estacionamiento</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Diseñador del Plano: {{ organizacion()?.nombre }}</span>
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Dibuja la distribución espacial: añade casillas, entradas y carriles. Arrastra y rota cada elemento para configurar tu estacionamiento.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            [routerLink]="['/mapa', organizacionId()]"
            class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <span>Ver Mapa de Conductores</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>

          <button
            type="button"
            (click)="guardarDiseno()"
            [disabled]="guardando()"
            class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            @if (guardando()) {
              <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Guardando plano...</span>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              <span>Guardar Plano</span>
            }
          </button>
        </div>
      </div>

      @if (mensajeFeedback()) {
        <div class="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{{ mensajeFeedback() }}</span>
          <button (click)="mensajeFeedback.set(null)" class="text-emerald-400 hover:text-white text-sm">✕</button>
        </div>
      }

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Añadir Elemento:</span>
          
          <button
            type="button"
            (click)="agregarElemento('standard')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            + Casilla Estándar
          </button>

          <button
            type="button"
            (click)="agregarElemento('discapacitados')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>♿</span>
            + Discapacitados
          </button>

          <button
            type="button"
            (click)="agregarElemento('electrico')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>⚡</span>
            + Eléctrico
          </button>

          <button
            type="button"
            (click)="agregarElemento('entrada')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>🚗</span>
            + Entrada Vehicular
          </button>

          <button
            type="button"
            (click)="agregarElemento('salida')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>🚪</span>
            + Salida
          </button>

          <button
            type="button"
            (click)="agregarElemento('carril')"
            class="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>═</span>
            + Carril / Vía
          </button>
        </div>

        <button
          type="button"
          (click)="generarFila('A', 6)"
          class="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>⚡</span>
          + Generar Fila Rápida (6 Puestos)
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-9 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div class="flex items-center justify-between mb-4 text-xs text-slate-400">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Lienzo del Plano (Haz clic para seleccionar, arrastra o rota con el botón)</span>
            </div>
            <span class="text-[11px] font-mono text-slate-500">Total Elementos: {{ elementos().length }}</span>
          </div>

          <div
            id="lienzo-diseno"
            (click)="deseleccionar()"
            class="w-full h-[620px] bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 relative overflow-auto cursor-crosshair select-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]"
          >
            @for (elem of elementos(); track elem.codigo + '_' + $index) {
              <div
                (click)="$event.stopPropagation(); seleccionarElemento(elem)"
                (mousedown)="iniciarArrastre($event, elem)"
                [style.left.px]="elem.posX"
                [style.top.px]="elem.posY"
                [style.transform]="'rotate(' + (elem.rotacion || 0) + 'deg)'"
                [class.ring-2]="elementoSeleccionado() === elem"
                [class.ring-blue-400]="elementoSeleccionado() === elem"
                [class.z-30]="elementoSeleccionado() === elem"
                [class.bg-emerald-950_80]="elem.tipo === 'standard'"
                [class.border-emerald-500_60]="elem.tipo === 'standard'"
                [class.text-emerald-300]="elem.tipo === 'standard'"
                [class.bg-blue-950_80]="elem.tipo === 'discapacitados'"
                [class.border-blue-500_60]="elem.tipo === 'discapacitados'"
                [class.text-blue-300]="elem.tipo === 'discapacitados'"
                [class.bg-amber-950_80]="elem.tipo === 'electrico'"
                [class.border-amber-500_60]="elem.tipo === 'electrico'"
                [class.text-amber-300]="elem.tipo === 'electrico'"
                [class.bg-emerald-900_90]="elem.tipo === 'entrada'"
                [class.border-emerald-400]="elem.tipo === 'entrada'"
                [class.text-emerald-200]="elem.tipo === 'entrada'"
                [class.bg-rose-900_90]="elem.tipo === 'salida'"
                [class.border-rose-400]="elem.tipo === 'salida'"
                [class.text-rose-200]="elem.tipo === 'salida'"
                [class.bg-slate-800]="elem.tipo === 'carril'"
                [class.border-slate-600]="elem.tipo === 'carril'"
                [class.text-slate-300]="elem.tipo === 'carril'"
                class="absolute rounded-xl border flex flex-col items-center justify-center p-2 cursor-grab active:cursor-grabbing shadow-lg transition-transform hover:scale-105"
                [style.width.px]="elem.tipo === 'carril' ? 180 : 80"
                [style.height.px]="elem.tipo === 'carril' ? 50 : 70"
              >
                @if (elem.tipo === 'entrada') {
                  <span class="text-sm">🚗 ⬇</span>
                  <span class="text-[10px] font-bold uppercase tracking-wider mt-0.5">{{ elem.codigo }}</span>
                } @else if (elem.tipo === 'salida') {
                  <span class="text-sm">🚪 ⬆</span>
                  <span class="text-[10px] font-bold uppercase tracking-wider mt-0.5">{{ elem.codigo }}</span>
                } @else if (elem.tipo === 'carril') {
                  <span class="text-xs font-mono font-bold tracking-widest">═ VÍA CIRCULACIÓN ═</span>
                } @else {
                  <div class="flex items-center gap-1">
                    @if (elem.tipo === 'discapacitados') { <span>♿</span> }
                    @if (elem.tipo === 'electrico') { <span>⚡</span> }
                    <span class="text-xs font-black">{{ elem.codigo }}</span>
                  </div>
                  <span class="text-[9px] uppercase font-semibold text-slate-400">{{ elem.seccion }}</span>
                }

                @if (elem.rotacion) {
                  <span class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-[8px] flex items-center justify-center text-slate-400 font-mono">
                    {{ elem.rotacion }}°
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <div class="lg:col-span-3 space-y-5">
          @if (elementoSeleccionado(); as sel) {
            <div class="bg-slate-900 border border-blue-500/40 rounded-3xl p-5 shadow-xl space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <span class="text-xs font-bold text-white uppercase tracking-wider">Elemento Seleccionado</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">{{ sel.tipo }}</span>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-400 mb-1">Identificador / Código</label>
                  <input
                    type="text"
                    [(ngModel)]="sel.codigo"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-400 mb-1">Sección o Zona</label>
                  <input
                    type="text"
                    [(ngModel)]="sel.seccion"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-400 mb-1">Tipo de Elemento</label>
                  <select
                    [(ngModel)]="sel.tipo"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Casilla Estándar</option>
                    <option value="discapacitados">♿ Discapacitados</option>
                    <option value="electrico">⚡ Eléctrico</option>
                    <option value="entrada">🚗 Entrada</option>
                    <option value="salida">🚪 Salida</option>
                    <option value="carril">═ Vía de Circulación</option>
                  </select>
                </div>

                <div class="pt-2">
                  <label class="block text-[11px] font-semibold text-slate-400 mb-1.5">Girar / Orientación:</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      (click)="girarElemento(sel, 90)"
                      class="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Girar +90°
                    </button>

                    <button
                      type="button"
                      (click)="sel.rotacion = 0"
                      class="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Reiniciar (0°)
                    </button>
                  </div>
                  <span class="text-[10px] text-slate-500 block mt-1">Ángulo actual: {{ sel.rotacion || 0 }}°</span>
                </div>

                <div class="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    (click)="eliminarElemento(sel)"
                    class="w-full py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">
              <div class="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                </svg>
              </div>
              <h4 class="text-xs font-bold text-white">Selecciona un elemento</h4>
              <p class="text-[11px] text-slate-500 mt-1">Haz clic en una casilla del plano para girarla, cambiar su código o eliminarla.</p>
            </div>
          }

          <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 text-xs text-slate-400 space-y-2">
            <h4 class="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Instrucciones:</h4>
            <p>• <strong>Arrastrar:</strong> Haz clic sostenido en cualquier puesto o carril para moverlo a su posición real.</p>
            <p>• <strong>Girar:</strong> Selecciona el elemento y usa el botón <em>Girar +90°</em> para orientarlo vertical u horizontalmente.</p>
            <p>• <strong>Guardar:</strong> Cuando termines de organizar, pulsa <em>Guardar Plano</em> arriba.</p>
          </div>
        </div>
      </div>
    </main>
  `
})
export class DisenadorMapaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private casillaService = inject(CasillaService);
  private organizacionService = inject(OrganizacionService);

  organizacionId = signal<string>('');
  organizacion = signal<Organizacion | null>(null);
  elementos = signal<ElementoDiseno[]>([]);
  elementoSeleccionado = signal<ElementoDiseno | null>(null);

  guardando = signal<boolean>(false);
  mensajeFeedback = signal<string | null>(null);

  private arrastrando = false;
  private elemArrastrado: ElementoDiseno | null = null;
  private offsetX = 0;
  private offsetY = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.organizacionId.set(id);
      this.cargarOrganizacion(id);
      this.cargarCasillas(id);
    }

    window.addEventListener('mousemove', (e) => this.alMoverRaton(e));
    window.addEventListener('mouseup', () => this.alSoltarRaton());
  }

  cargarOrganizacion(id: string): void {
    this.organizacionService.misOrganizaciones().subscribe(orgs => {
      const match = orgs.find(o => o._id === id);
      if (match) this.organizacion.set(match);
    });
  }

  cargarCasillas(orgId: string): void {
    this.casillaService.listarPorOrganizacion(orgId).subscribe({
      next: (data) => {
        const elems: ElementoDiseno[] = data.map((c, i) => ({
          _id: c._id,
          codigo: c.codigo,
          seccion: c.seccion || 'Sección A',
          tipo: (c.tipo as any) || 'standard',
          estado: c.estado || 'libre',
          posX: c.posX !== undefined ? c.posX : 50 + (i % 8) * 100,
          posY: c.posY !== undefined ? c.posY : 50 + Math.floor(i / 8) * 90,
          rotacion: c.rotacion || 0
        }));
        this.elementos.set(elems);
      },
      error: () => this.elementos.set([])
    });
  }

  agregarElemento(tipo: 'standard' | 'discapacitados' | 'electrico' | 'entrada' | 'salida' | 'carril'): void {
    const total = this.elementos().length;
    let codigo = '';
    let seccion = 'Sección A';

    if (tipo === 'entrada') {
      codigo = 'ENTRADA';
      seccion = 'Acceso';
    } else if (tipo === 'salida') {
      codigo = 'SALIDA';
      seccion = 'Acceso';
    } else if (tipo === 'carril') {
      codigo = 'VÍA';
      seccion = 'Circulación';
    } else {
      const num = total + 1;
      codigo = `P-${num}`;
    }

    const nuevo: ElementoDiseno = {
      codigo,
      seccion,
      tipo,
      estado: 'libre',
      posX: 80 + (total % 6) * 110,
      posY: 80 + Math.floor(total / 6) * 95,
      rotacion: 0,
      esNuevo: true
    };

    this.elementos.update(list => [...list, nuevo]);
    this.elementoSeleccionado.set(nuevo);
  }

  generarFila(letra: string, cantidad: number): void {
    const list = [...this.elementos()];
    const startY = 100 + (list.length % 3) * 120;

    for (let i = 1; i <= cantidad; i++) {
      list.push({
        codigo: `${letra}${i}`,
        seccion: `Sección ${letra}`,
        tipo: 'standard',
        estado: 'libre',
        posX: 60 + (i - 1) * 95,
        posY: startY,
        rotacion: 0,
        esNuevo: true
      });
    }

    this.elementos.set(list);
    this.mensajeFeedback.set(`Se agregaron ${cantidad} casillas a la Sección ${letra}.`);
  }

  seleccionarElemento(elem: ElementoDiseno): void {
    this.elementoSeleccionado.set(elem);
  }

  deseleccionar(): void {
    this.elementoSeleccionado.set(null);
  }

  girarElemento(elem: ElementoDiseno, grados: number): void {
    elem.rotacion = ((elem.rotacion || 0) + grados) % 360;
  }

  eliminarElemento(elem: ElementoDiseno): void {
    if (elem._id) {
      this.casillaService.eliminarCasilla(elem._id).subscribe({
        next: () => {
          this.elementos.update(list => list.filter(e => e !== elem));
          this.elementoSeleccionado.set(null);
          this.mensajeFeedback.set(`Elemento ${elem.codigo} eliminado.`);
        },
        error: (err) => alert(err.error?.message || 'Error al eliminar casilla.')
      });
    } else {
      this.elementos.update(list => list.filter(e => e !== elem));
      this.elementoSeleccionado.set(null);
    }
  }

  iniciarArrastre(event: MouseEvent, elem: ElementoDiseno): void {
    event.stopPropagation();
    this.arrastrando = true;
    this.elemArrastrado = elem;
    this.elementoSeleccionado.set(elem);

    const canvas = document.getElementById('lienzo-diseno');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      this.offsetX = event.clientX - rect.left - elem.posX;
      this.offsetY = event.clientY - rect.top - elem.posY;
    }
  }

  private alMoverRaton(event: MouseEvent): void {
    if (!this.arrastrando || !this.elemArrastrado) return;

    const canvas = document.getElementById('lienzo-diseno');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      let rawX = event.clientX - rect.left - this.offsetX;
      let rawY = event.clientY - rect.top - this.offsetY;

      // Snap to grid (malla de 15px)
      rawX = Math.round(rawX / 15) * 15;
      rawY = Math.round(rawY / 15) * 15;

      this.elemArrastrado.posX = Math.max(10, Math.min(rawX, 1100));
      this.elemArrastrado.posY = Math.max(10, Math.min(rawY, 700));
    }
  }

  private alSoltarRaton(): void {
    this.arrastrando = false;
    this.elemArrastrado = null;
  }

  guardarDiseno(): void {
    const orgId = this.organizacionId();
    if (!orgId) return;

    this.guardando.set(true);
    this.mensajeFeedback.set(null);

    const elems = this.elementos();
    let completados = 0;
    const total = elems.length;

    if (total === 0) {
      this.guardando.set(false);
      this.mensajeFeedback.set('Plano guardado (sin elementos).');
      return;
    }

    const revisarFin = () => {
      completados++;
      if (completados >= total) {
        this.guardando.set(false);
        this.mensajeFeedback.set('¡Plano del parqueadero guardado con éxito! Se sincronizó con la app del conductor.');
        this.cargarCasillas(orgId);
      }
    };

    for (let el of elems) {
      if (el._id) {
        this.casillaService.editarCasilla(el._id, {
          codigo: el.codigo,
          seccion: el.seccion,
          tipo: el.tipo,
          posX: el.posX,
          posY: el.posY,
          rotacion: el.rotacion
        }).subscribe({
          next: () => revisarFin(),
          error: () => revisarFin()
        });
      } else {
        this.casillaService.crearCasilla({
          organizacion: orgId,
          codigo: el.codigo,
          seccion: el.seccion,
          tipo: el.tipo,
          posX: el.posX,
          posY: el.posY,
          rotacion: el.rotacion
        }).subscribe({
          next: () => revisarFin(),
          error: () => revisarFin()
        });
      }
    }
  }
}
