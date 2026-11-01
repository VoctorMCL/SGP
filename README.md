# SGP - Sistema de Gestión de Parqueo

Proyecto para **Desarrollo Web** (Unilasallista) por **Víctor Manuel Córdoba Larez** y **Ricardo Jaraba Gallego**.

Aplicación **Fullstack unificada (MEAN + Tailwind + Capacitor)**. Un solo proyecto, un solo servidor tanto para web como para API.

---

## Índice
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Correr en Web (Local)](#correr-en-web-local)
- [Correr en Android con Capacitor](#correr-en-android-con-capacitor)
- [Scripts Útiles](#scripts-útiles)
- [Cuentas de Prueba (Seed Data)](#cuentas-de-prueba-seed-data)
- [Notas Importantes](#notas-importantes)

---

## Estructura del Proyecto

```text
SGP/
├── package.json         # ÚNICO archivo de dependencias y scripts
├── angular.json         # Configuración del frontend Angular 22
├── tsconfig.json        # Configuración TypeScript
├── capacitor.config.ts  # Configuración de Capacitor (Android/iOS)
├── scripts/             # Scripts utilitarios
│   └── set-mobile-ip.js # Detecta IP local y actualiza environments para móvil
│
├── src/                 # FRONTEND: Angular 22 + Tailwind CSS v4
│   ├── app/
│   │   ├── core/        # Servicios (Auth, Socket, Casillas, Reservas), Guards e Interceptores
│   │   ├── shared/      # Componentes compartidos (Navbar, etc.)
│   │   └── features/    # Vistas por módulo (auth, organizaciones, parqueadero-mapa, admin-dashboard)
│   ├── environments/    # Configuración de URLs por ambiente (web/nativo)
│   └── styles.css
│
├── server/              # BACKEND: Express 5 + MongoDB + Socket.io
│   ├── app.js           # Configuración pura de Express (middlewares, rutas, estáticos, SPA fallback)
│   ├── server.js        # Arranque puro (conexión BD, HTTP + Socket.io, listen)
│   ├── config/
│   │   └── db.js        # Conexión centralizada a MongoDB
│   ├── controllers/     # Lógica de endpoints
│   ├── routes/          # Definición de rutas REST
│   ├── models/          # Esquemas Mongoose
│   ├── helpers/         # Utilidades (JWT, validaciones, Socket.io)
│   ├── index.js         # Compatibilidad: re-exporta server.js
│   └── seed.js          # Sembrado de datos de prueba
│
├── api/                 # Entry point para despliegues serverless
│   └── index.js
│
└── android/             # Plataforma Android generada por Capacitor (se crea con cap add android)
```

---

## Requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado 20+)
- [MongoDB](https://www.mongodb.com/) local (`mongodb://localhost:27017/parqueo`) o [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Android Studio](https://developer.android.com/studio) (solo para correr/empaquetar en Android)
- **PC y celular conectados a la MISMA red WiFi** (para probar en físico)

---

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd SGP

# Instalar dependencias
npm install
```

Crear un archivo `.env` en la raíz (puedes guiarte con `.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/parqueo
PORT=2305
JWT_SECRET=tu_clave_secreta
```

Poblar la base de datos con datos de prueba:

```bash
npm run seed
```

---

## Correr en Web (Local)

Tienes dos formas:

### Opción 1: Un solo comando (Backend + Frontend servidos por Express)
```bash
# Compilar Angular primero (si quieres probar con archivos estáticos)
npm run build

# Levantar servidor
npm start
# o con recarga automática del backend
npm run dev
```

Abre: **[http://localhost:2305](http://localhost:2305)**

El servidor sirve al mismo tiempo:
- Web de Angular en `/`
- API REST en `/api/...`
- WebSockets en `/socket.io`

### Opción 2: Desarrollo con hot-reload (Angular + proxy)
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend con ng serve
npm run dev:ui
```

---

## Correr en Android con Capacitor

Para probar la app en tu celular **en la misma red WiFi** sigue estos pasos al pie de la letra.

### 1) Conectar PC y celular a la misma red
Ambos deben estar conectados a **exactamente la misma red WiFi**. Si cambias de red, tendrás que actualizar la IP.

### 2) Levantar el backend
En la raíz del proyecto:

```bash
npm start
# o
npm run dev
```

El backend debe quedar corriendo en `http://TU_IP_LOCAL:2305`

### 3) Actualizar IP y compilar para móvil (TODO AUTOMÁTICO)

**Recomendado:** Un solo comando se encarga de todo

```bash
npm run build:mobile
```

Este comando hace:
1. `mobile:ip` → Detecta automáticamente la IP de tu PC en esa red WiFi y la escribe en `src/environments/environment.ts` y `src/environments/environment.prod.ts`
2. `ng build` → Compila Angular para producción
3. `npx cap sync android` → Copia los archivos compilados a la carpeta `android/`

Si solo quieres actualizar la IP sin recompilar:

```bash
npm run mobile:ip
```

### 4) Abrir y correr desde Android Studio

```bash
npx cap open android
```

Se abrirá **Android Studio** con el proyecto `android/`.

Desde ahí:
1. Espera a que Gradle sincronice (primera vez tarda un poco)
2. Conecta tu celular por USB con **Depuración USB** activada, o usa un emulador
3. Selecciona tu dispositivo y pulsa el botón **Run ▶**

### ¿Qué hacer si cambio de WiFi?

Si te conectas a otra red (casa distinta, hotspot, etc.) **la IP de tu PC cambia**. Para arreglarlo:

```bash
# 1) Asegúrate que PC y celular estén en la NUEVA red
# 2) Vuelve a correr este comando
npm run build:mobile

# 3) Abre Android Studio y vuelve a ejecutar la app
npx cap open android
```

Listo. No tienes que editar archivos a mano.

---

## Scripts Útiles

| Script | Descripción |
|---|---|
| `npm start` | Levanta el servidor con `server/server.js` (producción/local unificado) |
| `npm run dev` | Igual que `start` pero con `--watch` para reiniciar el backend al guardar cambios |
| `npm run dev:ui` | Corre Angular con `ng serve` (útil para desarrollo con hot-reload) |
| `npm run build` | Compila el frontend Angular a `dist/frontend/browser/` |
| `npm run seed` | Puebla la BD con usuarios/organización/casillas de prueba |
| `npm run mobile:ip` | Detecta y actualiza la IP local en los environments para usar en celular |
| `npm run build:mobile` | **Recomendado para móvil**: actualiza IP + build + sync con Android |
| `npm run cap:sync` | Sincroniza cambios web con las plataformas nativas (`android/`) |
| `npm run cap:android` | Abre el proyecto Android en Android Studio |

---

## Cuentas de Prueba (Seed Data)

| Rol | Correo | Contraseña |
|---|---|---|
| **Administrador** | `admin@sgp.com` | `123456` |
| **Guardia** | `guardia@sgp.com` | `123456` |
| **Conductor** | `conductor@sgp.com` | `123456` |

---

## Notas Importantes

- **Estructura limpia**: El backend ahora está separado en `app.js` (configuración) y `server.js` (arranque). Mucho más fácil de entender.
- **Móvil automático**: Los `environments` usan `Capacitor.isNativePlatform()` para decidir si usar rutas relativas o la IP de tu PC.
- **HTTP en red local**: Se añadió `android:usesCleartextTraffic="true"` y `network_security_config.xml` para permitir conexión HTTP con tu servidor local.
- **WebSockets**: Funcionan tanto en web (`/`) como en móvil apuntando a `http://IP:2305`
- **Si no hay build de Angular**: Al acceder a `/` sin `dist/frontend/browser`, el servidor mostrará un mensaje indicando que debes compilar con `npm run build`.
- **Cambios en red WiFi**: **SIEMPRE** correr `npm run build:mobile` después de cambiar de red.
