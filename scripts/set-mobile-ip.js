const fs = require('fs');
const path = require('path');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Preferir redes WiFi/Ethernet comunes
        if (
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          iface.address.startsWith('172.')
        ) {
          return iface.address;
        }
      }
    }
  }
  // Fallback por si no encuentra nada
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.100';
}

const ip = getLocalIP();
console.log(`IP detectada para app móvil: ${ip}`);

// Actualizar environment.ts (desarrollo)
const envDevPath = path.join(__dirname, '../src/environments/environment.ts');
let envDev = fs.readFileSync(envDevPath, 'utf8');
envDev = envDev.replace(/const LAN_IP = ['"][^'"]+['"];/, `const LAN_IP = '${ip}';`);
fs.writeFileSync(envDevPath, envDev);
console.log('Actualizado: src/environments/environment.ts');

// Actualizar environment.prod.ts (para APK)
const envProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');
let envProd = fs.readFileSync(envProdPath, 'utf8');
// Si ya tienes un dominio puesto, no lo sobreescribe. Solo actualiza si dice TU_DOMINIO
if (envProd.includes('TU_DOMINIO_O_IP_PUBLICA')) {
  envProd = envProd.replace(/const PROD_SERVER_URL = ['"][^'"]+['"];/, `const PROD_SERVER_URL = 'http://${ip}:2305';`);
  fs.writeFileSync(envProdPath, envProd);
  console.log('Actualizado: src/environments/environment.prod.ts (usando IP local)');
} else {
  console.log('Se mantiene PROD_SERVER_URL tal como está en environment.prod.ts');
}
