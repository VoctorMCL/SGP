import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="themeService.alternar()"
      [attr.aria-label]="esOscuro ? 'Activar modo claro' : 'Activar modo oscuro'"
      [attr.title]="esOscuro ? 'Modo claro' : 'Modo oscuro'"
    >
      @if (esOscuro) {
        <!-- Sol: se muestra la acción de pasar a claro -->
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="4.2"></circle>
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"></path>
        </svg>
      } @else {
        <!-- Luna: se muestra la acción de pasar a oscuro -->
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5a8.5 8.5 0 1 0 10.9 10.9Z"></path>
        </svg>
      }
    </button>
  `
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  get esOscuro(): boolean {
    return this.themeService.tema() === 'dark';
  }
}
