import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Los scripts de Vercel solo existen en despliegues de Vercel; en local/dev
// devuelven HTML y provocan errores en consola.
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (!isLocal) {
  injectAnalytics();
  injectSpeedInsights();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
