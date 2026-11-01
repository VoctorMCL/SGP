import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
// Cambia esta IP por la IP de tu PC en la red local (ipconfig/ifconfig)
const LAN_IP = '192.168.78.212';
const SERVER_URL = isNative ? `http://${LAN_IP}:2305` : '';

export const environment = {
  production: false,
  apiUrl: isNative ? `${SERVER_URL}/api` : '/api',
  socketUrl: isNative ? SERVER_URL : '/'
};
