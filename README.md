# SGP - Sistema de Gestión de Parqueo

Proyecto para **Desarrollo Web** (Unilasallista) por **Víctor Manuel Córdoba Larez** y **Ricardo Jaraba Gallego**.

Aplicación **Fullstack unificada (MEAN + Tailwind + Capacitor)** lista para desplegar en **Vercel** o ejecutar en local como **un solo proyecto y un solo servidor**.

---

## 🏗️ Estructura Unificada del Proyecto

A diferencia de un monorepo dividido con scripts artificiales, aquí el proyecto es **una sola aplicación cohesiva**:

```
SGP/
├── package.json         # ÚNICO archivo de dependencias y scripts
├── angular.json         # Configuración del frontend Angular 22
├── tsconfig.json        # Configuración TypeScript
├── capacitor.config.ts  # Soporte nativo móvil (Android / iOS)
├── vercel.json          # Configuración de despliegue directo en Vercel
│
├── src/                 # FRONTEND: Angular 22 + Tailwind CSS v4
│   ├── app/
│   │   ├── core/        # Servicios (Auth, Socket, Casillas, Reservas), Guards e Interceptores
│   │   ├── shared/      # Navbar con perfil de usuario y buscador
│   │   └── features/    # Pantallas fieles a la presentación:
│   │       ├── auth/             # Login / Registro y Unirse con Código
│   │       ├── organizaciones/   # Mis Organizaciones y Crear Sede
│   │       ├── parqueadero-mapa/ # Mapa interactivo en tiempo real del conductor
│   │       └── admin-dashboard/  # Panel de guardia/admin con alertas críticas
│   ├── styles.css       # Estilos Tailwind con tema oscuro moderno
│   └── index.html       # Shell HTML principal
│
├── server/              # BACKEND: Express 5 + MongoDB + Socket.io
│   ├── controllers/     # Lógica de endpoints (usuario, organizacion, casilla, reserva)
│   ├── models/          # Esquemas Mongoose
│   ├── routes/          # Rutas REST (/api/...)
│   ├── helpers/         # JWT, validaciones, WebSockets
│   ├── applications.js  # App Express (sirve la API y los estáticos de Angular)
│   ├── index.js         # Servidor local en puerto 2305
│   └── seed.js          # Sembrado de datos de prueba
│
└── api/                 # SERVERLESS: Entrada para Vercel
    └── index.js         # Conexión automática a MongoDB Atlas y función serverless
```

---

## ⚡ Cómo Usar el Proyecto

### 1. Poblar la Base de Datos con Datos de Prueba
```bash
npm run seed
```

### 2. Iniciar el Servidor (Un solo comando, un solo puerto)
```bash
npm start
```
*(O `npm run dev` para reinicio automático si modificas el backend)*

Abre tu navegador en:
👉 **`http://localhost:2305`**

El servidor de Express sirve **al mismo tiempo**:
- La aplicación web de Angular en `/`
- La API REST en `/api/...`
- Los WebSockets de Socket.io en `/socket.io`

---

## ☁️ Despliegue en Vercel (100% Automático)

Al ser una sola estructura con [`vercel.json`](vercel.json) y [`api/index.js`](api/index.js):

1. Sube tu proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), dale a **Add New Project** e importa tu repositorio.
3. En la sección **Environment Variables**, añade la conexión de tu base de datos de MongoDB (por ejemplo de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)):
   - **Nombre:** `MONGO_URI`
   - **Valor:** `mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/parqueo?retryWrites=true&w=majority`
4. Presiona **Deploy**.

Vercel compilará automáticamente el frontend en Angular (`npm run build`) y montará la API de Express en `/api/*` sin que tengas que configurar nada más.

---

## 🔑 Cuentas de Prueba (Seed Data)
| Rol | Correo | Contraseña |
|---|---|---|
| **Administrador** | `admin@sgp.com` | `123456` |
| **Guardia** | `guardia@sgp.com` | `123456` |
| **Conductor** | `conductor@sgp.com` | `123456` |
