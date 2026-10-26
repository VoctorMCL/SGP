import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sgp.parqueo',
  appName: 'SGP Parqueadero',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
