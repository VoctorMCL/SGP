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
    <div class="relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <!-- ── Panel editorial ───────────────────────────────────── -->
      <section class="relative flex flex-col justify-between overflow-hidden border-b border-edge px-6 py-10 sm:px-12 lg:border-b-0 lg:border-r lg:px-16 lg:py-14">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-flow/[0.13] blur-[110px]"></div>
          <div class="absolute -bottom-52 right-0 h-[32rem] w-[32rem] rounded-full bg-signal/[0.06] blur-[120px]"></div>
          <div class="absolute inset-0 line-grid opacity-[0.4] [mask-image:radial-gradient(70%_60%_at_35%_35%,#000_20%,transparent_100%)]"></div>
          <div class="absolute left-0 top-0 h-1 w-2/3 bg-gradient-to-r from-signal via-signal/40 to-transparent"></div>
        </div>

        <div class="relative z-10">
          <!-- Marca -->
          <div class="flex items-center gap-4">
            <div class="notch-sm relative grid h-14 w-14 place-items-center bg-signal text-void shadow-[0_0_40px_-8px_rgba(216,255,62,0.7)]">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square">
                <path d="M7.5 18V6h5.2a3.6 3.6 0 1 1 0 7.2H8.4" />
                <path d="M7.5 13.2h5.2" />
              </svg>
              <span class="absolute -bottom-px -right-px h-2.5 w-2.5 bg-flow"></span>
            </div>
            <div>
              <div class="flex items-baseline gap-2.5">
                <span class="text-3xl sm:text-4xl font-bold tracking-tight text-chalk">SGP</span>
                <span class="mono text-xs font-semibold tracking-widest text-signal">V1.0</span>
              </div>
              <p class="mono mt-1 text-xs uppercase tracking-widest text-mist">Sistema de Gestión de Parqueo</p>
            </div>
          </div>

          <!-- Titular -->
          <div class="mt-12 max-w-xl lg:mt-16">
            <h1 class="text-4xl font-bold leading-[1.02] tracking-tight text-chalk sm:text-5xl xl:text-[4.2rem]">
              Cada espacio,<br />
              <span class="relative inline-block text-signal">
                bajo control.
                <svg class="absolute -bottom-2 left-0 w-full text-signal/45" height="8" viewBox="0 0 300 8" preserveAspectRatio="none" fill="none">
                  <path d="M1 6.2C66 2.4 223 1.3 299 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-mist">
              Disponibilidad en vivo, reservas y planos interactivos para conjuntos, empresas y centros comerciales.
              Una sola consola para toda tu operación.
            </p>
          </div>

          <!-- Previsualización en vivo (Diseño vertical) -->
          <div class="mt-10 max-w-xl">
            <div class="panel notch overflow-hidden">
              <div class="flex items-center justify-between border-b border-edge px-5 py-4">
                <div class="flex items-center gap-2.5">
                  <span class="live-dot"></span>
                  <span class="mono text-xs sm:text-sm font-semibold uppercase tracking-wider text-chalk">Mayorca Etapa II · Nivel 2</span>
                </div>
                <span class="tag tag-signal text-xs">En vivo</span>
              </div>
              <div class="p-5">
                <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                  <!-- Columna Bahías Izquierda (Zona A) -->
                  <div class="flex flex-col gap-2">
                    @for (slot of demoSlots; track slot.codigo) {
                      <div
                        class="relative flex h-11 items-center justify-between rounded-md border px-3 transition-colors"
                        [class]="slot.ocupado
                          ? 'border-danger/35 bg-danger/[0.09] text-danger'
                          : 'border-ok/30 bg-ok/[0.06] text-ok'"
                      >
                        <span class="mono text-xs font-bold tracking-wider">{{ slot.codigo }}</span>
                        <span class="mono text-[0.68rem] font-medium flex items-center gap-1.5">
                          <span class="h-1.5 w-1.5 rounded-full" [class]="slot.ocupado ? 'bg-danger' : 'bg-ok'"></span>
                          {{ slot.ocupado ? 'Ocupado' : 'Libre' }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- Vía de circulación vertical central -->
                  <div class="flex flex-col items-center justify-between py-2 px-3 border-x border-dashed border-white/20 bg-white/[0.015] rounded">
                    <div class="flex flex-col items-center gap-1 text-center">
                      <span class="mono text-[0.62rem] font-bold uppercase tracking-widest text-signal">▲ ENTRADA</span>
                      <span class="mono text-xs text-mist/60">↓</span>
                    </div>
                    <div class="flex flex-col items-center gap-4 py-4 text-mist/35">
                      <span class="mono text-xs">↓</span>
                      <span class="mono text-xs">↓</span>
                      <span class="mono text-xs">↓</span>
                    </div>
                    <div class="flex flex-col items-center gap-1 text-center">
                      <span class="mono text-xs text-mist/60">↓</span>
                      <span class="mono text-[0.62rem] font-bold uppercase tracking-widest text-mist/80">▼ SALIDA</span>
                    </div>
                  </div>

                  <!-- Columna Bahías Derecha (Zona B) -->
                  <div class="flex flex-col gap-2">
                    @for (slot of demoSlotsB; track slot.codigo) {
                      <div
                        class="relative flex h-11 items-center justify-between rounded-md border px-3 transition-colors"
                        [class]="slot.ocupado
                          ? 'border-danger/35 bg-danger/[0.09] text-danger'
                          : 'border-ok/30 bg-ok/[0.06] text-ok'"
                      >
                        <span class="mono text-[0.68rem] font-medium flex items-center gap-1.5">
                          <span class="h-1.5 w-1.5 rounded-full" [class]="slot.ocupado ? 'bg-danger' : 'bg-ok'"></span>
                          {{ slot.ocupado ? 'Ocupado' : 'Libre' }}
                        </span>
                        <span class="mono text-xs font-bold tracking-wider">{{ slot.codigo }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Resumen inferior -->
                <div class="mt-4 flex items-center justify-between border-t border-edge pt-3 text-xs sm:text-sm">
                  <div class="flex items-center gap-5 text-mist">
                    <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-ok"></span><strong class="text-chalk font-semibold">{{ libresDemo }}</strong> libres</span>
                    <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-danger"></span><strong class="text-chalk font-semibold">{{ ocupadosDemo }}</strong> ocupados</span>
                  </div>
                  <span class="mono font-semibold text-signal">{{ ocupacionDemo }}% ocupación</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Panel de acceso ───────────────────────────────────── -->
      <section class="relative flex min-h-[38rem] items-center justify-center px-6 py-12 sm:px-12 lg:min-h-0 lg:px-16">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute inset-0 bg-[#080b11]"></div>
          <div class="absolute inset-0 line-grid opacity-20"></div>
          <div class="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-signal/20 to-transparent"></div>
        </div>

        <div class="relative z-10 w-full max-w-[28rem]">
          <div class="mb-8">
            <h2 class="text-3xl font-semibold tracking-tight text-chalk">Bienvenido a SGP</h2>
            <p class="mt-2 text-sm sm:text-base text-mist">Ingresa tus credenciales para acceder a la plataforma.</p>
          </div>

          <!-- Tabs -->
          <div class="mb-7 flex border-b border-edge">
            <button
              type="button"
              (click)="tabActiva.set('login')"
              class="relative px-2 pb-3.5 pr-8 text-sm sm:text-base font-semibold transition-colors"
              [class.text-chalk]="tabActiva() === 'login'"
              [class.text-mist]="tabActiva() !== 'login'"
            >
              Iniciar sesión
              @if (tabActiva() === 'login') {
                <span class="absolute bottom-[-1px] left-0 h-[2px] w-12 bg-signal"></span>
              }
            </button>
            <button
              type="button"
              (click)="tabActiva.set('register')"
              class="relative px-2 pb-3.5 text-sm sm:text-base font-semibold transition-colors"
              [class.text-chalk]="tabActiva() === 'register'"
              [class.text-mist]="tabActiva() !== 'register'"
            >
              Crear cuenta
              @if (tabActiva() === 'register') {
                <span class="absolute bottom-[-1px] left-0 h-[2px] w-12 bg-signal"></span>
              }
            </button>
          </div>

          @if (errorMensaje()) {
            <div class="mb-5 flex items-start gap-3 rounded-md border border-danger/30 bg-danger/[0.07] p-3.5 text-xs sm:text-sm leading-relaxed text-danger">
              <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="1.8"></circle>
                <path stroke-linecap="round" stroke-width="1.8" d="M12 8v4m0 3.5v.01"></path>
              </svg>
              <span>{{ errorMensaje() }}</span>
            </div>
          }

          @if (exitoMensaje()) {
            <div class="mb-5 flex items-start gap-3 rounded-md border border-ok/30 bg-ok/[0.07] p-3.5 text-xs sm:text-sm leading-relaxed text-ok">
              <svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
              </svg>
              <span>{{ exitoMensaje() }}</span>
            </div>
          }

          @if (tabActiva() === 'login') {
            <form [formGroup]="loginForm" (ngSubmit)="onSubmitLogin()" class="space-y-5">
              <div>
                <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block" for="login-correo">Correo electrónico</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-mist/60">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.8"></rect>
                      <path stroke-width="1.8" d="m3.5 7 8.5 6 8.5-6"></path>
                    </svg>
                  </span>
                  <input id="login-correo" type="email" formControlName="correo" placeholder="nombre@empresa.com" class="field text-sm sm:text-base h-12 pl-10 pr-4" />
                </div>
              </div>

              <div>
                <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block" for="login-pass">Contraseña</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-mist/60">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="10" width="16" height="10" rx="2" stroke-width="1.8"></rect>
                      <path stroke-width="1.8" d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                    </svg>
                  </span>
                  <input
                    id="login-pass"
                    [type]="verPassword() ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="••••••••"
                    class="field text-sm sm:text-base h-12 pl-10 pr-12"
                  />
                  <button
                    type="button"
                    (click)="verPassword.set(!verPassword())"
                    class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-mist/70 transition-colors hover:text-chalk"
                    [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    @if (verPassword()) {
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 4.5 9 7a11 11 0 0 1-2.4 3.4M6.1 6.6C3.9 8 2.6 10.2 3 12c.7 2.5 4.3 5 9 5 1 0 2-.2 2.9-.5"></path>
                      </svg>
                    } @else {
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="1.7" d="M3 12c.7-2.5 4.3-5 9-5s8.3 2.5 9 5c-.7 2.5-4.3 5-9 5s-8.3-2.5-9-5Z"></path>
                        <circle cx="12" cy="12" r="2.4" stroke-width="1.7"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" [disabled]="cargando()" class="btn btn-signal mt-2 h-12 w-full text-sm sm:text-base font-bold">
                @if (cargando()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                  <span>Iniciando sesión…</span>
                } @else {
                  <span>Iniciar sesión</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                  </svg>
                }
              </button>
            </form>
          }

          @if (tabActiva() === 'register') {
            <form [formGroup]="registerForm" (ngSubmit)="onSubmitRegister()" class="space-y-3.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Nombre</label>
                  <input type="text" formControlName="nombre" placeholder="Juan" class="field text-sm h-11" />
                </div>
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Apellido</label>
                  <input type="text" formControlName="apellido" placeholder="Pérez" class="field text-sm h-11" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Documento</label>
                  <input type="text" formControlName="documento" placeholder="10001000" class="field field-mono text-sm h-11" />
                </div>
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Teléfono</label>
                  <input type="text" formControlName="telefono" placeholder="3001234567" class="field field-mono text-sm h-11" />
                </div>
              </div>

              <div>
                <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Correo electrónico</label>
                <input type="email" formControlName="correo" placeholder="juan@empresa.com" class="field text-sm h-11" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Contraseña</label>
                  <input type="password" formControlName="password" placeholder="••••••••" class="field text-sm h-11" />
                </div>
                <div>
                  <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Rol</label>
                  <select formControlName="rol" class="field text-sm h-11">
                    <option value="usuario">Conductor</option>
                    <option value="guardia">Guardia</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label text-xs sm:text-sm font-medium text-chalk/90 mb-1.5 block">Placas <span class="normal-case tracking-normal text-mist/60">(separadas por coma)</span></label>
                <input type="text" formControlName="placasStr" placeholder="ABC-123, XYZ-789" class="field field-mono text-sm uppercase h-11" />
              </div>

              <button type="submit" [disabled]="cargando()" class="btn btn-signal mt-2 h-12 w-full text-sm sm:text-base font-bold">
                @if (cargando()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                  <span>Creando cuenta…</span>
                } @else {
                  <span>Crear cuenta</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                  </svg>
                }
              </button>
            </form>
          }

          <div class="mt-8 flex items-center justify-between border-t border-edge pt-5">
            <a routerLink="/unirse" class="group inline-flex items-center gap-2 text-sm font-medium text-mist transition-colors hover:text-chalk">
              <svg class="h-4 w-4 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7l6-6A6 6 0 1 1 21 9Z"></path>
              </svg>
              Tengo un código de invitación
              <span class="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </div>
      </section>
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
  verPassword = signal<boolean>(false);

  demoSlots = [
    { codigo: 'A-01', ocupado: false },
    { codigo: 'A-02', ocupado: true },
    { codigo: 'A-03', ocupado: false },
    { codigo: 'A-04', ocupado: false },
    { codigo: 'A-05', ocupado: true },
    { codigo: 'A-06', ocupado: false }
  ];

  demoSlotsB = [
    { codigo: 'B-01', ocupado: true },
    { codigo: 'B-02', ocupado: false },
    { codigo: 'B-03', ocupado: false },
    { codigo: 'B-04', ocupado: false },
    { codigo: 'B-05', ocupado: true },
    { codigo: 'B-06', ocupado: false }
  ];

  get ocupadosDemo(): number {
    return [...this.demoSlots, ...this.demoSlotsB].filter((s) => s.ocupado).length;
  }

  get libresDemo(): number {
    return this.demoSlots.length + this.demoSlotsB.length - this.ocupadosDemo;
  }

  get ocupacionDemo(): number {
    return Math.round((this.ocupadosDemo / (this.demoSlots.length + this.demoSlotsB.length)) * 100);
  }

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
    const placas = val.placasStr ? val.placasStr.split(',').map((p) => p.trim()).filter((p) => p.length > 0) : [];

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
