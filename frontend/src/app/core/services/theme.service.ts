import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const CLAVE_TEMA = 'sgp-theme';
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

/**
 * Tema visual de la aplicación.
 *
 * Sin preferencia guardada, el tema sigue automáticamente la configuración
 * del dispositivo (`prefers-color-scheme`) y reacciona en vivo cuando cambia.
 * Si la persona usa el interruptor, su elección queda guardada en localStorage
 * y pasa a tener prioridad sobre el sistema. El oscuro es el valor de fábrica
 * cuando el dispositivo no permite detectar la preferencia.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  private preferenciaExplicita: Tema | null = this.leerPreferencia();

  readonly tema = signal<Tema>(this.preferenciaExplicita ?? this.temaDelSistema());

  constructor() {
    this.aplicar(this.tema(), false);
    this.observarSistema();
  }

  alternar(): void {
    const siguiente: Tema = this.tema() === 'dark' ? 'light' : 'dark';
    this.preferenciaExplicita = siguiente;
    this.aplicar(siguiente, true);
  }

  private leerPreferencia(): Tema | null {
    try {
      const guardado = this.document.defaultView?.localStorage.getItem(CLAVE_TEMA);
      if (guardado === 'light' || guardado === 'dark') {
        return guardado;
      }
    } catch {
      // localStorage puede no estar disponible (modo privado, WebView, etc.).
    }

    return null;
  }

  private temaDelSistema(): Tema {
    try {
      const ventana = this.document.defaultView;
      if (ventana?.matchMedia) {
        return ventana.matchMedia(CONSULTA_OSCURO).matches ? 'dark' : 'light';
      }
    } catch {
      // Sin matchMedia se conserva el tema de fábrica.
    }

    return 'dark';
  }

  /** Sigue los cambios del sistema mientras no haya una elección manual. */
  private observarSistema(): void {
    try {
      const consulta = this.document.defaultView?.matchMedia?.(CONSULTA_OSCURO);
      if (!consulta) {
        return;
      }

      const alCambiar = (evento: MediaQueryListEvent): void => {
        if (this.preferenciaExplicita) {
          return;
        }
        this.aplicar(evento.matches ? 'dark' : 'light', false);
      };

      if (typeof consulta.addEventListener === 'function') {
        consulta.addEventListener('change', alCambiar);
      } else if (typeof consulta.addListener === 'function') {
        consulta.addListener(alCambiar);
      }
    } catch {
      // Si el navegador no expone matchMedia, el tema inicial sigue vigente.
    }
  }

  private aplicar(tema: Tema, persistir: boolean): void {
    this.tema.set(tema);

    const raiz = this.document.documentElement;
    raiz.setAttribute('data-theme', tema);
    raiz.style.colorScheme = tema;

    if (persistir) {
      try {
        this.document.defaultView?.localStorage.setItem(CLAVE_TEMA, tema);
      } catch {
        // Sin persistencia: el tema sigue funcionando durante la sesión.
      }
    }

    const metaTema = this.document.querySelector('meta[name="theme-color"]');
    metaTema?.setAttribute('content', tema === 'dark' ? '#05070b' : '#f4f6fb');
  }
}
