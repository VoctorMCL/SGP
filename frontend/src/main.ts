import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { inject } from '@vercel/analytics';

// El script de Vercel solo existe en despliegues de Vercel; en local/dev
// devuelve HTML y provoca un SyntaxError en consola.
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (!isLocal) inject();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
