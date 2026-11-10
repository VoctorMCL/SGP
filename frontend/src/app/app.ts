import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');

  private router = inject(Router);
  private document = inject(DOCUMENT);
  private themeService = inject(ThemeService);

  constructor() {
    // La inyección crea el servicio temprano; su constructor aplica el tema
    // del sistema o la preferencia guardada antes de la primera navegación.
    this.themeService.tema();
    this.aplicarEscala(this.document.defaultView?.location.pathname ?? '');
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.aplicarEscala(event.urlAfterRedirects));
  }

  /**
   * El login se mantiene en su escala original y las pantallas internas usan
   * una base más grande para que la tipografía sea legible.
   */
  private aplicarEscala(url: string): void {
    const enLogin = url.startsWith('/login');
    this.document.documentElement.style.fontSize = enLogin ? '16px' : '20px';
    this.document.body.classList.toggle('app-autenticado', !enLogin);
  }
}
