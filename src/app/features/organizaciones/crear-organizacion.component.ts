import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CasillaService } from '../../core/services/casilla.service';

@Component({
  selector: 'app-crear-organizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <!-- Breadcrumb -->
      <a routerLink="/organizaciones" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Volver a Mis Organizaciones
      </a>

      <!-- Title & instructions (Slide 8 wireframe) -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Crear Nueva Organización</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
          Configura los detalles maestros de tu red de estacionamientos. Define capacidades, ubicación espacial y genera credenciales de acceso privadas para tu equipo.
        </p>
      </div>

      @if (errorMensaje()) {
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMensaje() }}</span>
        </div>
      }

      <form [formGroup]="orgForm" (ngSubmit)="crear()" class="space-y-6">
        <!-- Panel 1: Identidad -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            1. Identidad de la Organización
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Organización</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="Ej. Parqueadero MetroMall S.A."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">NIT / Identificación Fiscal</label>
              <input
                type="text"
                formControlName="nit"
                placeholder="900123456-7"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Entidad</label>
              <select
                formControlName="tipoEntidad"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Mixto">Mixto</option>
                <option value="Publico">Público</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Dirección Principal</label>
              <input
                type="text"
                formControlName="direccion"
                placeholder="Calle 10 # 45-20, Medellín"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Descripción Corta</label>
              <textarea
                rows="2"
                formControlName="descripcion"
                placeholder="Breve descripción de la sede y accesos disponibles..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Panel 2: Capacidad y Operación -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            2. Capacidad y Operación
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Total de Puestos</label>
              <input
                type="number"
                min="1"
                formControlName="totalPuestos"
                placeholder="48"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Límite de Miembros</label>
              <input
                type="number"
                min="1"
                formControlName="limiteMiembros"
                placeholder="100"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Zona Horaria</label>
              <input
                type="text"
                formControlName="zonaHoraria"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Permisos y checkboxes (Slide 8 wireframe) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="reservasPublicas" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Reservas Públicas</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="cobroAutomatico" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Cobro Automático</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="cobroPorHora" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Cobro por Hora</span>
            </label>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
              <input type="checkbox" formControlName="acceso24_7" class="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700">
              <span class="text-xs font-medium text-slate-300">Acceso 24/7</span>
            </label>
          </div>
        </div>

        <!-- Submit Button (Slide 8 wireframe) -->
        <div class="flex items-center justify-end gap-4">
          <a routerLink="/organizaciones" class="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold">
            Cancelar
          </a>
          <button
            type="submit"
            [disabled]="cargando()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            @if (cargando()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Guardando...</span>
            } @else {
              <span>Finalizar y Crear Organización</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            }
          </button>
        </div>
      </form>
    </main>
  `
})
export class CrearOrganizacionComponent {
  private fb = inject(FormBuilder);
  private organizacionService = inject(OrganizacionService);
  private casillaService = inject(CasillaService);
  private router = inject(Router);

  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  orgForm = this.fb.group({
    nombre: ['', [Validators.required]],
    nit: ['', [Validators.required]],
    tipoEntidad: ['Residencial', [Validators.required]],
    direccion: ['', [Validators.required]],
    descripcion: [''],
    totalPuestos: [24, [Validators.required, Validators.min(1)]],
    limiteMiembros: [100, [Validators.required, Validators.min(1)]],
    zonaHoraria: ['America/Bogota', [Validators.required]],
    reservasPublicas: [true],
    cobroAutomatico: [false],
    cobroPorHora: [false],
    acceso24_7: [true]
  });

  crear(): void {
    if (this.orgForm.invalid) {
      this.errorMensaje.set('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const val = this.orgForm.value as any;

    this.organizacionService.crearOrganizacion(val).subscribe({
      next: (res) => {
        const orgId = res.organizacion._id;
        const total = val.totalPuestos || 24;
        this.autogenerarCasillas(orgId, total);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al crear la organización.');
      }
    });
  }

  private autogenerarCasillas(orgId: string, total: number): void {
    const porSeccion = Math.min(12, Math.ceil(total / 2));
    const secciones = ['A', 'B', 'C', 'D'];
    let count = 0;

    const crearSiguiente = (sIndex: number, cIndex: number) => {
      if (count >= total || sIndex >= secciones.length) {
        this.cargando.set(false);
        this.router.navigate(['/mapa', orgId]);
        return;
      }

      const sec = secciones[sIndex];
      const codigo = `${sec}${cIndex}`;
      const tipo = cIndex === 1 ? 'discapacitados' : 'standard';

      this.casillaService.crearCasilla({
        organizacion: orgId,
        codigo: codigo,
        seccion: `Sección ${sec}`,
        tipo: tipo
      }).subscribe({
        next: () => {
          count++;
          if (cIndex >= porSeccion) {
            crearSiguiente(sIndex + 1, 1);
          } else {
            crearSiguiente(sIndex, cIndex + 1);
          }
        },
        error: () => {
          count++;
          if (cIndex >= porSeccion) {
            crearSiguiente(sIndex + 1, 1);
          } else {
            crearSiguiente(sIndex, cIndex + 1);
          }
        }
      });
    };

    crearSiguiente(0, 1);
  }
}
