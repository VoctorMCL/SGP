import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
// Para APK/Play Store apunta a tu dominio/IP pública
const PROD_SERVER_URL = 'http://192.168.78.212:2305';
const SERVER_URL = isNative ? PROD_SERVER_URL : '';

export const environment = {
  production: true,
  apiUrl: isNative ? `${SERVER_URL}/api` : '/api',
  socketUrl: isNative ? SERVER_URL : '/'
};
