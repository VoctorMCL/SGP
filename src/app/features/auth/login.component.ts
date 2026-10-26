import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <!-- Left Hero Banner (Slide 5) -->
      <div class="lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
        <!-- Background decorative ambient circles -->
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Brand -->
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25">
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v7"></path>
                <path d="M12 15v7"></path>
                <path d="m4.93 4.93 4.95 4.95"></path>
                <path d="m14.12 14.12 4.95 4.95"></path>
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-extrabold text-white tracking-tight">SGP</h1>
              <p class="text-xs uppercase tracking-wider text-blue-400 font-semibold">Sistema de Gestión de Parqueo</p>
            </div>
          </div>

          <div class="space-y-4 max-w-lg mt-8">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
              La forma más inteligente de estacionar en la ciudad.
            </h2>
            <p class="text-slate-400 text-sm sm:text-base leading-relaxed">
              Controla la disponibilidad y ocupación de tu estacionamiento. Gestión simple y en tiempo real de espacios de parqueo para organizaciones, empresas y conjuntos residenciales.
            </p>
          </div>
        </div>

        <!-- Quick Demo Profiles & Features list -->
        <div class="mt-12 relative z-10">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Acceso rápido de prueba (Seed Data):</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              (click)="autocompletar('admin@sgp.com', '123456')"
              class="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-500/50"
            >
              <div class="text-[10px] uppercase font-bold text-blue-400">Administrador</div>
              <div class="text-xs text-slate-200 font-medium">admin&#64;sgp.com</div>
              <div class="text-[11px] text-slate-500">Pass: 123456</div>
            </button>

            <button
              type="button"
              (click)="autocompletar('guardia@sgp.com', '123456')"
              class="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-500/50"
            >
              <div class="text-[10px] uppercase font-bold text-emerald-400">Guardia</div>
              <div class="text-xs text-slate-200 font-medium">guardia&#64;sgp.com</div>
              <div class="text-[11px] text-slate-500">Pass: 123456</div>
            </button>

            <button
              type="button"
              (click)="autocompletar('conductor@sgp.com', '123456')"
              class="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-500/50"
            >
              <div class="text-[10px] uppercase font-bold text-purple-400">Conductor</div>
              <div class="text-xs text-slate-200 font-medium">conductor&#64;sgp.com</div>
              <div class="text-[11px] text-slate-500">Pass: 123456</div>
            </button>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
            <span>Universidad Lasallista — Desarrollo Web</span>
            <span>Ricardo Jaraba & Víctor Córdoba</span>
          </div>
        </div>
      </div>

      <!-- Right Form Column (Slide 5) -->
      <div class="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div class="w-full max-w-md">
          <!-- Welcome title -->
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-white tracking-tight">¡Bienvenido de nuevo!</h3>
            <p class="text-sm text-slate-400 mt-1">Ingresa tus credenciales para acceder a tu panel de parqueo.</p>
          </div>

          <!-- Switch tabs: Iniciar Sesión / Registrarse -->
          <div class="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              (click)="tabActiva.set('login')"
              [class.bg-blue-600]="tabActiva() === 'login'"
              [class.text-white]="tabActiva() === 'login'"
              [class.text-slate-400]="tabActiva() !== 'login'"
              class="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              (click)="tabActiva.set('register')"
              [class.bg-blue-600]="tabActiva() === 'register'"
              [class.text-white]="tabActiva() === 'register'"
              [class.text-slate-400]="tabActiva() !== 'register'"
              class="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Registrarse
            </button>
          </div>

          @if (errorMensaje()) {
            <div class="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMensaje() }}</span>
            </div>
          }

          @if (exitoMensaje()) {
            <div class="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>{{ exitoMensaje() }}</span>
            </div>
          }

          <!-- Form: Iniciar Sesión -->
          @if (tabActiva() === 'login') {
            <form [formGroup]="loginForm" (ngSubmit)="onSubmitLogin()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  formControlName="correo"
                  placeholder="nombre@ejemplo.com"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                [disabled]="cargando()"
                class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                @if (cargando()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Ingresando...</span>
                } @else {
                  <span>Ingresar Ahora</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- Form: Registrarse -->
          @if (tabActiva() === 'register') {
            <form [formGroup]="registerForm" (ngSubmit)="onSubmitRegister()" class="space-y-3.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    formControlName="nombre"
                    placeholder="Ej. Juan"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    formControlName="apellido"
                    placeholder="Ej. Pérez"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Cédula / Documento</label>
                  <input
                    type="text"
                    formControlName="documento"
                    placeholder="10001000"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Teléfono (10 dígitos)</label>
                  <input
                    type="text"
                    formControlName="telefono"
                    placeholder="3001234567"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  formControlName="correo"
                  placeholder="juan@ejemplo.com"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                  <input
                    type="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Rol</label>
                  <select
                    formControlName="rol"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="usuario">Usuario / Conductor</option>
                    <option value="guardia">Guardia</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Placas de vehículos (separadas por coma)</label>
                <input
                  type="text"
                  formControlName="placasStr"
                  placeholder="Ej. ABC-123, XYZ-789"
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                [disabled]="cargando()"
                class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                @if (cargando()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Registrando...</span>
                } @else {
                  <span>Crear Cuenta</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- Shortcut to invitation code (Slide 5) -->
          <div class="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <a
              routerLink="/unirse"
              class="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
              ¿Tienes un código de invitación? Únete aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  tabActiva = signal<'login' | 'register'>('login');
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  exitoMensaje = signal<string | null>(null);

  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    documento: ['', [Validators.required]],
    telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rol: ['usuario', [Validators.required]],
    placasStr: ['']
  });

  autocompletar(correo: string, pass: string): void {
    this.tabActiva.set('login');
    this.loginForm.patchValue({ correo, password: pass });
    this.errorMensaje.set(null);
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      this.errorMensaje.set('Por favor completa todos los campos correctamente.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const creds = {
      correo: this.loginForm.value.correo!,
      password: this.loginForm.value.password!
    };

    this.authService.login(creds).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/organizaciones']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al iniciar sesión.');
      }
    });
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      this.errorMensaje.set('Por favor verifica los campos obligatorios (el teléfono debe tener 10 dígitos).');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const val = this.registerForm.value;
    const placas = val.placasStr ? val.placasStr.split(',').map(p => p.trim()).filter(p => p.length > 0) : [];

    const datos: any = {
      nombre: val.nombre,
      apellido: val.apellido,
      documento: val.documento,
      telefono: val.telefono,
      correo: val.correo,
      password: val.password,
      rol: val.rol,
      placas: placas
    };

    this.authService.registrar(datos).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exitoMensaje.set('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
        this.tabActiva.set('login');
        this.loginForm.patchValue({ correo: datos.correo, password: datos.password });
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al crear la cuenta.');
      }
    });
  }
}
