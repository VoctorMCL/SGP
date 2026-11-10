import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const CLAVE_TEMA = 'sgp-theme';

/**
 * Tema visual de la aplicación.
 *
 * El tema oscuro es el de fábrica. La preferencia se guarda en localStorage y
 * se refleja en el atributo `data-theme` de <html>, que es el que consume la
 * hoja de estilos para aplicar la paleta clara.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.leerTemaInicial());

  constructor() {
    this.aplicar(this.tema());
  }

  alternar(): void {
    this.aplicar(this.tema() === 'dark' ? 'light' : 'dark');
  }

  establecer(tema: Tema): void {
    this.aplicar(tema);
  }

  private leerTemaInicial(): Tema {
    try {
      const guardado = this.document.defaultView?.localStorage.getItem(CLAVE_TEMA);
      if (guardado === 'light' || guardado === 'dark') {
        return guardado;
      }
    } catch {
      // localStorage puede no estar disponible (modo privado, WebView, etc.).
    }

    const atributo = this.document.documentElement.getAttribute('data-theme');
    return atributo === 'light' ? 'light' : 'dark';
  }

  private aplicar(tema: Tema): void {
    this.tema.set(tema);

    const raiz = this.document.documentElement;
    raiz.setAttribute('data-theme', tema);
    raiz.style.colorScheme = tema;

    try {
      this.document.defaultView?.localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin persistencia: el tema sigue funcionando durante la sesión.
    }

    const metaTema = this.document.querySelector('meta[name="theme-color"]');
    metaTema?.setAttribute('content', tema === 'dark' ? '#05070b' : '#f4f6fb');
  }
}
