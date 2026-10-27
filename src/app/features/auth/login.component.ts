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
    <div class="relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[1.06fr_0.94fr]">
      <!-- ── Panel editorial ───────────────────────────────────── -->
      <section class="relative flex flex-col justify-between overflow-hidden border-b border-edge px-5 py-8 sm:px-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-12">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-flow/[0.13] blur-[110px]"></div>
          <div class="absolute -bottom-52 right-0 h-[30rem] w-[30rem] rounded-full bg-signal/[0.06] blur-[120px]"></div>
          <div class="absolute inset-0 line-grid opacity-[0.55] [mask-image:radial-gradient(70%_60%_at_35%_35%,#000_20%,transparent_100%)]"></div>
          <div class="absolute right-10 top-9 hidden font-mono text-[15rem] font-bold leading-none text-white/[0.022] xl:block">SGP</div>
          <div class="absolute left-0 top-0 h-1 w-2/3 bg-gradient-to-r from-signal via-signal/40 to-transparent"></div>
        </div>

        <div class="relative z-10">
          <!-- Marca -->
          <div class="flex items-start justify-between gap-6">
            <div class="flex items-center gap-3.5">
              <div class="notch-sm relative grid h-12 w-12 place-items-center bg-signal text-void shadow-[0_0_40px_-8px_rgba(216,255,62,0.7)]">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square">
                  <path d="M7.5 18V6h5.2a3.6 3.6 0 1 1 0 7.2H8.4" />
                  <path d="M7.5 13.2h5.2" />
                </svg>
                <span class="absolute -bottom-px -right-px h-2 w-2 bg-flow"></span>
              </div>
              <div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold tracking-[-0.05em] text-chalk">SGP</span>
                  <span class="mono text-[0.58rem] tracking-[0.22em] text-signal">V1.0</span>
                </div>
                <p class="mono mt-1 text-[0.56rem] uppercase tracking-[0.22em] text-mist">Sistema de Gestión de Parqueo</p>
              </div>
            </div>

            <span class="hidden items-center gap-2 rounded-full border border-edge bg-white/[0.025] px-3 py-1.5 text-[0.6rem] font-medium text-mist sm:inline-flex">
              <span class="live-dot"></span>
              Sistema operativo
            </span>
          </div>

          <!-- Titular -->
          <div class="mt-12 max-w-xl lg:mt-16">
            <span class="kicker rise">Movilidad / Tiempo real</span>
            <h1 class="rise-2 mt-5 text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.045em] text-chalk sm:text-6xl xl:text-[4.15rem]">
              Cada espacio,<br />
              <span class="relative inline-block text-signal">
                bajo control.
                <svg class="absolute -bottom-2 left-0 w-full text-signal/45" height="8" viewBox="0 0 300 8" preserveAspectRatio="none" fill="none">
                  <path d="M1 6.2C66 2.4 223 1.3 299 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </span>
            </h1>
            <p class="rise-3 mt-7 max-w-md text-sm leading-relaxed text-mist">
              Disponibilidad en vivo, reservas y planos interactivos para conjuntos, empresas y centros comerciales.
              Una sola consola para toda tu operación.
            </p>
          </div>

          <!-- Previsualización en vivo -->
          <div class="rise-4 mt-9 max-w-lg">
            <div class="panel notch overflow-hidden">
              <div class="flex items-center justify-between border-b border-edge px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <span class="live-dot"></span>
                  <span class="mono text-[0.58rem] uppercase tracking-[0.18em] text-chalk">Sede Norte · Nivel 2</span>
                </div>
                <span class="tag tag-signal">En vivo</span>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-6 gap-1.5">
                  @for (slot of demoSlots; track $index) {
                    <div
                      class="relative flex h-9 flex-col items-center justify-center rounded-[3px] border text-[0.55rem] font-semibold transition-colors"
                      [class]="slot.ocupado
                        ? 'border-danger/35 bg-danger/[0.09] text-danger/90'
                        : 'border-ok/30 bg-ok/[0.055] text-ok/90'"
                    >
                      <span class="mono leading-none">{{ slot.codigo }}</span>
                      <span class="mt-0.5 h-0.5 w-2.5 rounded-full" [class]="slot.ocupado ? 'bg-danger/70' : 'bg-ok/70'"></span>
                    </div>
                  }
                </div>
                <div class="my-2.5 flex items-center gap-2">
                  <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/70">Entrada</span>
                  <div class="relative h-px flex-1 border-t border-dashed border-white/20">
                    <span class="absolute left-0 top-1/2 h-1 w-16 -translate-y-1/2 bg-gradient-to-r from-signal/70 to-transparent"></span>
                  </div>
                  <span class="mono text-[0.5rem] uppercase tracking-[0.16em] text-mist/70">Salida</span>
                </div>
                <div class="grid grid-cols-6 gap-1.5">
                  @for (slot of demoSlotsB; track $index) {
                    <div
                      class="flex h-9 items-center justify-center rounded-[3px] border text-[0.55rem] font-semibold"
                      [class]="slot.ocupado
                        ? 'border-danger/35 bg-danger/[0.09] text-danger/90'
                        : 'border-ok/30 bg-ok/[0.055] text-ok/90'"
                    >
                      <span class="mono leading-none">{{ slot.codigo }}</span>
                    </div>
                  }
                </div>
                <div class="mt-3.5 flex items-center justify-between border-t border-edge pt-3">
                  <div class="flex items-center gap-4 text-[0.6rem] text-mist">
                    <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-ok"></span>{{ libresDemo }} libres</span>
                    <span class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-danger"></span>{{ ocupadosDemo }} ocupados</span>
                  </div>
                  <span class="mono text-[0.55rem] text-signal">{{ ocupacionDemo }}% ocupación</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Accesos demo + créditos -->
        <div class="relative z-10 mt-10">
          <div class="mb-2.5 flex items-center gap-2">
            <span class="mono text-[0.55rem] uppercase tracking-[0.2em] text-mist">Acceso rápido de prueba</span>
            <span class="h-px flex-1 bg-edge"></span>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              (click)="autocompletar('admin@sgp.com', '123456')"
              class="group flex items-center justify-between rounded-md border border-edge bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-signal/35 hover:bg-signal/[0.035]"
            >
              <span>
                <span class="mono block text-[0.5rem] uppercase tracking-[0.16em] text-signal">Administrador</span>
                <span class="mt-0.5 block text-[0.68rem] text-chalk">admin&#64;sgp.com</span>
              </span>
              <svg class="h-3.5 w-3.5 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </button>

            <button
              type="button"
              (click)="autocompletar('guardia@sgp.com', '123456')"
              class="group flex items-center justify-between rounded-md border border-edge bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-ok/35 hover:bg-ok/[0.03]"
            >
              <span>
                <span class="mono block text-[0.5rem] uppercase tracking-[0.16em] text-ok">Guardia</span>
                <span class="mt-0.5 block text-[0.68rem] text-chalk">guardia&#64;sgp.com</span>
              </span>
              <svg class="h-3.5 w-3.5 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ok" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </button>

            <button
              type="button"
              (click)="autocompletar('conductor@sgp.com', '123456')"
              class="group flex items-center justify-between rounded-md border border-edge bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-flow/45 hover:bg-flow/[0.04]"
            >
              <span>
                <span class="mono block text-[0.5rem] uppercase tracking-[0.16em] text-flow">Conductor</span>
                <span class="mt-0.5 block text-[0.68rem] text-chalk">conductor&#64;sgp.com</span>
              </span>
              <svg class="h-3.5 w-3.5 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-flow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </button>
          </div>
          <div class="mono mt-5 flex items-center justify-between text-[0.52rem] uppercase tracking-[0.14em] text-mist/60">
            <span>Unilasallista · Desarrollo Web</span>
            <span class="hidden sm:inline">Jaraba · Córdoba</span>
          </div>
        </div>
      </section>

      <!-- ── Panel de acceso ───────────────────────────────────── -->
      <section class="relative flex min-h-[38rem] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-0 lg:px-14">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute inset-0 bg-[#080b11]"></div>
          <div class="absolute inset-0 line-grid opacity-25"></div>
          <div class="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-signal/20 to-transparent"></div>
          <span class="absolute left-6 top-6 h-5 w-5 border-l border-t border-edge-strong"></span>
          <span class="absolute bottom-6 right-6 h-5 w-5 border-b border-r border-edge-strong"></span>
        </div>

        <div class="relative z-10 w-full max-w-[26rem]">
          <div class="mb-7 flex items-end justify-between">
            <div>
              <span class="kicker">Acceso seguro</span>
              <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-chalk">Bienvenido de nuevo</h2>
              <p class="mt-1 text-xs text-mist">Ingresa tus credenciales para abrir la consola.</p>
            </div>
            <span class="mono hidden text-right text-[0.52rem] uppercase leading-relaxed tracking-[0.14em] text-mist/60 sm:block">
              SESIÓN<br />ENCRIPTADA
            </span>
          </div>

          <!-- Tabs -->
          <div class="mb-6 flex border-b border-edge">
            <button
              type="button"
              (click)="tabActiva.set('login')"
              class="relative px-1 pb-3 pr-6 text-[0.7rem] font-semibold transition-colors"
              [class.text-chalk]="tabActiva() === 'login'"
              [class.text-mist]="tabActiva() !== 'login'"
            >
              Iniciar sesión
              @if (tabActiva() === 'login') {
                <span class="absolute bottom-[-1px] left-0 h-[2px] w-9 bg-signal"></span>
              }
            </button>
            <button
              type="button"
              (click)="tabActiva.set('register')"
              class="relative px-1 pb-3 text-[0.7rem] font-semibold transition-colors"
              [class.text-chalk]="tabActiva() === 'register'"
              [class.text-mist]="tabActiva() !== 'register'"
            >
              Crear cuenta
              @if (tabActiva() === 'register') {
                <span class="absolute bottom-[-1px] left-0 h-[2px] w-9 bg-signal"></span>
              }
            </button>
          </div>

          @if (errorMensaje()) {
            <div class="mb-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/[0.07] p-3 text-[0.7rem] leading-relaxed text-danger">
              <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="1.8"></circle>
                <path stroke-linecap="round" stroke-width="1.8" d="M12 8v4m0 3.5v.01"></path>
              </svg>
              <span>{{ errorMensaje() }}</span>
            </div>
          }

          @if (exitoMensaje()) {
            <div class="mb-4 flex items-start gap-2.5 rounded-md border border-ok/30 bg-ok/[0.07] p-3 text-[0.7rem] leading-relaxed text-ok">
              <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4 10-10"></path>
              </svg>
              <span>{{ exitoMensaje() }}</span>
            </div>
          }

          @if (tabActiva() === 'login') {
            <form [formGroup]="loginForm" (ngSubmit)="onSubmitLogin()" class="space-y-4">
              <div>
                <label class="label" for="login-correo">Correo electrónico</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mist/60">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.8"></rect>
                      <path stroke-width="1.8" d="m3.5 7 8.5 6 8.5-6"></path>
                    </svg>
                  </span>
                  <input id="login-correo" type="email" formControlName="correo" placeholder="nombre@empresa.com" class="field pl-9" />
                </div>
              </div>

              <div>
                <label class="label" for="login-pass">Contraseña</label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-mist/60">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="10" width="16" height="10" rx="2" stroke-width="1.8"></rect>
                      <path stroke-width="1.8" d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                    </svg>
                  </span>
                  <input
                    id="login-pass"
                    [type]="verPassword() ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="••••••••"
                    class="field pl-9 pr-11"
                  />
                  <button
                    type="button"
                    (click)="verPassword.set(!verPassword())"
                    class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-mist/70 transition-colors hover:text-chalk"
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

              <button type="submit" [disabled]="cargando()" class="btn btn-signal mt-1 h-11 w-full">
                @if (cargando()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-void/25 border-t-void"></span>
                  <span>Validando acceso…</span>
                } @else {
                  <span>Entrar a la consola</span>
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-5-5 5 5-5 5"></path>
                  </svg>
                }
              </button>
            </form>
          }

          @if (tabActiva() === 'register') {
            <form [formGroup]="registerForm" (ngSubmit)="onSubmitRegister()" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Nombre</label>
                  <input type="text" formControlName="nombre" placeholder="Juan" class="field" />
                </div>
                <div>
                  <label class="label">Apellido</label>
                  <input type="text" formControlName="apellido" placeholder="Pérez" class="field" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Documento</label>
                  <input type="text" formControlName="documento" placeholder="10001000" class="field field-mono" />
                </div>
                <div>
                  <label class="label">Teléfono</label>
                  <input type="text" formControlName="telefono" placeholder="3001234567" class="field field-mono" />
                </div>
              </div>

              <div>
                <label class="label">Correo electrónico</label>
                <input type="email" formControlName="correo" placeholder="juan@empresa.com" class="field" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Contraseña</label>
                  <input type="password" formControlName="password" placeholder="••••••••" class="field" />
                </div>
                <div>
                  <label class="label">Rol</label>
                  <select formControlName="rol" class="field">
                    <option value="usuario">Conductor</option>
                    <option value="guardia">Guardia</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="label">Placas <span class="normal-case tracking-normal text-mist/50">(separadas por coma)</span></label>
                <input type="text" formControlName="placasStr" placeholder="ABC-123, XYZ-789" class="field field-mono uppercase" />
              </div>

              <button type="submit" [disabled]="cargando()" class="btn btn-signal mt-1 h-11 w-full">
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

          <div class="mt-7 flex items-center justify-between border-t border-edge pt-5">
            <a routerLink="/unirse" class="group inline-flex items-center gap-2 text-[0.68rem] font-medium text-mist transition-colors hover:text-chalk">
              <svg class="h-3.5 w-3.5 text-signal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 .3-.7l6-6A6 6 0 1 1 21 9Z"></path>
              </svg>
              Tengo un código de invitación
              <span class="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <span class="mono hidden text-[0.52rem] uppercase tracking-[0.14em] text-mist/50 sm:block">TLS / JWT</span>
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

  demoSlots = Array.from({ length: 18 }, (_, i) => ({
    codigo: String(i + 1).padStart(2, '0'),
    ocupado: [2, 5, 9, 12, 16].includes(i)
  }));

  demoSlotsB = Array.from({ length: 12 }, (_, i) => ({
    codigo: `B${String(i + 1).padStart(2, '0')}`,
    ocupado: [1, 6, 10].includes(i)
  }));

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
