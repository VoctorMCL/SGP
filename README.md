# SGP - Sistema de Gestión de Parqueo

Proyecto para **Desarrollo Web** (Unilasallista) por **Víctor Manuel Cordoba Larez** y **Ricardo Jaraba Gallego**.

Aplicación **Fullstack unificada (MEAN + Tailwind + Capacitor)**. Un solo proyecto, un solo servidor tanto para web como para API.

---

## Tecnologías Utilizadas

| Tecnología | Versión | Capa | Uso en el proyecto |
| --- | --- | --- | --- |
| **Node.js** | 18+ (recomendado 20+) | Runtime | Ejecuta el backend y las herramientas de build |
| **npm** | 10+ | Herramientas | Gestión de dependencias y scripts |
| **Git** | — | Herramientas | Control de versiones del código |
| **TypeScript** | ~6.0.2 | Lenguaje | Tipado estático del frontend y la configuración |
| **Angular** | ^22.2.0 | Frontend | Framework SPA con componentes standalone, rutas y formularios |
| **Angular CLI / Angular Build** | ^22.2.5 | Frontend | Compilación, empaquetado y servidor de desarrollo |
| **RxJS** | ~7.8.0 | Frontend | Programación reactiva y manejo de observables |
| **tslib** | ^2.3.0 | Frontend | Utilidades de soporte para el código compilado por TypeScript |
| **Tailwind CSS** | ^4.3.3 | Estilos | Utilidades CSS, tema visual y diseño responsive |
| **PostCSS** | ^8.5.3 | Estilos | Procesamiento de CSS para Tailwind |
| **@tailwindcss/postcss** | ^4.3.3 | Estilos | Integración oficial de Tailwind CSS v4 con PostCSS |
| **Google Fonts (Nunito)** | — | Estilos | Tipografía de la interfaz |
| **HTML5 / CSS3** | — | Frontend | Estructura y estilos base de la aplicación web |
| **Leaflet** | ^1.9.4 | Mapas | Mapas interactivos para ubicar sedes y diseñar planos |
| **OpenStreetMap** | — | Mapas | Tiles del mapa y servicio de geocodificación |
| **Nominatim** | — | Mapas | Búsqueda y geocodificación inversa de direcciones |
| **Google Maps Tiles** | — | Mapas | Imágenes satelitales en el diseñador de planos |
| **Socket.io Client** | ^4.8.4 | Tiempo real | Recepción de eventos de casillas y reservas en vivo |
| **Capacitor Core** | ^8.5.3 | Móvil | Puente entre la app web y las APIs nativas |
| **Capacitor Android** | ^8.6.0 | Móvil | Empaquetado y ejecución de la app en Android |
| **Capacitor CLI** | ^8.6.0 | Móvil | Sincronización y apertura del proyecto Android |
| **Android Studio** | — | Móvil | Compilación, emulación y pruebas de la app Android |
| **Express** | ^5.2.1 | Backend | Servidor HTTP y API REST |
| **body-parser** | ^2.3.0 | Backend | Parseo de cuerpos JSON y URL-encoded |
| **CORS** | ^2.8.6 | Backend | Control de acceso entre orígenes |
| **dotenv** | ^18.0.9 | Configuración | Carga de variables de entorno desde `.env` |
| **MongoDB** | Local o Atlas | Base de datos | Persistencia NoSQL de usuarios, sedes, casillas y reservas |
| **Mongoose** | ^9.10.4 | Base de datos | Esquemas, modelos, validaciones y consultas a MongoDB |
| **bcrypt** | ^6.0.0 | Seguridad | Hash seguro de contraseñas |
| **JWT (jwt-simple)** | ^0.5.6 | Seguridad | Autenticación mediante tokens firmados |
| **Socket.io** | ^4.8.4 | Tiempo real | Servidor WebSocket para emitir cambios en tiempo real |
| **Moment.js** | ^2.31.0 | Fechas | Formateo y cálculos de fechas |
| **moment-timezone** | ^0.6.5 | Fechas | Manejo de zonas horarias |
| **tz-lookup** | ^6.1.25 | Fechas | Deducción de zona horaria a partir de coordenadas |
| **Vercel Analytics** | ^2.0.1 | Despliegue | Métricas de uso en producción |
| **Vercel Speed Insights** | ^2.1.0 | Despliegue | Métricas de rendimiento web |
| **Vercel** | — | Despliegue | Plataforma serverless para el entry point `api/index.js` |
| **Postman** | — | Pruebas | Verificación manual de los endpoints REST |

---

## Índice
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Correr en Web (Local)](#correr-en-web-local)
- [Correr en Android con Capacitor](#correr-en-android-con-capacitor)
- [Scripts Útiles](#scripts-útiles)
- [Cuentas de Prueba (Seed Data)](#cuentas-de-prueba-seed-data)
- [API REST](#api-rest)
- [Guía de Pruebas en Postman](#guía-de-pruebas-en-postman)
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
├── frontend/            # FRONTEND: Angular 22 + Tailwind CSS v4
│   ├── public/          # Recursos estáticos (favicon, etc.)
│   └── src/
│       ├── app/
│       │   ├── core/    # Servicios (Auth, Socket, Casillas, Reservas), Guards e Interceptores
│       │   ├── shared/  # Componentes compartidos (Navbar, etc.)
│       │   └── features/ # Vistas por módulo (auth, organizaciones, parqueadero-mapa, admin-dashboard)
│       ├── environments/ # Configuración de URLs por ambiente (web/nativo)
│       ├── index.html
│       ├── main.ts
│       └── styles.css
│
├── backend/             # BACKEND: Express 5 + MongoDB + Socket.io
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
1. `mobile:ip` → Detecta automáticamente la IP de tu PC en esa red WiFi y la escribe en `frontend/src/environments/environment.ts` y `frontend/src/environments/environment.prod.ts`
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
| `npm start` | Levanta el servidor con `backend/server.js` (producción/local unificado) |
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

## API REST

**URL base local:** `http://localhost:2305`

**URL base en celular:** `http://TU_IP_LOCAL:2305`

Todas las respuestas son **JSON**. Las rutas protegidas necesitan este header:

```http
Authorization: Bearer <TOKEN>
```

El `<TOKEN>` se obtiene con el login y vence a los **60 minutos**. En las peticiones `POST`, `PATCH` y `PUT` también debes enviar:

```http
Content-Type: application/json
```

### Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/usuario/registrar` | Público | Registra un usuario |
| `GET` | `/api/usuario/disponible` | Público | Verifica si un correo o documento está disponible |
| `POST` | `/api/usuario/login` | Público | Inicia sesión y devuelve el token |
| `POST` | `/api/usuario/recuperar` | Público | Cambia la contraseña con correo y documento |
| `GET` | `/api/usuario/perfil` | Token | Devuelve el perfil del usuario autenticado |
| `POST` | `/api/organizacion` | Token + administrador | Crea una sede |
| `GET` | `/api/organizacion` | Token | Lista las sedes a las que pertenece el usuario |
| `GET` | `/api/organizacion/todas` | Token | Lista todas las sedes del sistema |
| `POST` | `/api/organizacion/unirse` | Token (no administrador) | Une al usuario a una sede por código de invitación |
| `GET` | `/api/organizacion/:id/miembros` | Token + miembro/creador | Lista los miembros de una sede |
| `PATCH` | `/api/organizacion/:id` | Token + creador | Edita una sede |
| `POST` | `/api/casilla` | Token + administrador | Crea un puesto, entrada, salida o carril |
| `GET` | `/api/casilla/organizacion/:organizacionId` | Token | Lista las casillas de una sede |
| `GET` | `/api/casilla/todas` | Token | Lista las casillas de todas las sedes |
| `PATCH` | `/api/casilla/:id/estado` | Token + guardia/administrador | Cambia una casilla entre `libre` y `ocupado` |
| `PATCH` | `/api/casilla/:id` | Token + creador | Edita una casilla |
| `PUT` | `/api/casilla/:id` | Token + creador | Igual que `PATCH /api/casilla/:id` |
| `DELETE` | `/api/casilla/:id` | Token + administrador | Elimina una casilla |
| `POST` | `/api/reserva` | Token | Crea una reserva |
| `PATCH` | `/api/reserva/:id/finalizar` | Token | Finaliza una reserva y libera el puesto |
| `GET` | `/api/reserva/propias` | Token | Lista las reservas del usuario |
| `GET` | `/api/reserva/organizacion/:organizacionId/alertas` | Token + guardia/administrador | Lista reservas vencidas de una sede |

---

### Usuarios

#### `POST /api/usuario/registrar`

Registra un usuario. Es público.

**Headers**

```http
Content-Type: application/json
```

**Body**

```json
{
  "nombre": "Laura",
  "apellido": "Martinez",
  "documento": "1000500055",
  "telefono": "3001112233",
  "correo": "laura@correo.com",
  "password": "123456",
  "placas": ["LMN-456"],
  "rol": "usuario"
}
```

- `telefono` debe tener exactamente **10 dígitos**.
- Cada placa debe tener el formato **ABC-123**.
- `rol` es opcional: `usuario`, `guardia` o `administrador`. Si no se envía, queda como `usuario`.
- `placas` es opcional.

**Respuesta `201`**

```json
{
  "message": "usuario creado",
  "usuario": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
    "nombre": "Laura",
    "apellido": "Martinez",
    "documento": "1000500055",
    "telefono": "3001112233",
    "correo": "laura@correo.com",
    "placas": ["LMN-456"],
    "rol": "usuario"
  }
}
```

---

#### `GET /api/usuario/disponible`

Verifica si un correo o documento ya está registrado. Es público.

**Headers:** ninguno.

**Query params**

| Parámetro | Obligatorio | Ejemplo |
|---|---|---|
| `correo` | No | `laura@correo.com` |
| `documento` | No | `1000500055` |

**URL de ejemplo**

```http
GET http://localhost:2305/api/usuario/disponible?correo=laura@correo.com&documento=1000500055
```

**Respuesta `200`**

```json
{
  "correoDisponible": false,
  "documentoDisponible": true
}
```

---

#### `POST /api/usuario/login`

Inicia sesión y devuelve el token JWT. Es público.

**Headers**

```http
Content-Type: application/json
```

**Body**

```json
{
  "correo": "admin@sgp.com",
  "password": "123456"
}
```

**Respuesta `200`**

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

Copia ese token y úsalo en las rutas protegidas:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

#### `POST /api/usuario/recuperar`

Cambia la contraseña usando correo y documento. Es público.

**Headers**

```http
Content-Type: application/json
```

**Body**

```json
{
  "correo": "conductor@sgp.com",
  "documento": "1000300033",
  "password": "nuevaClave123"
}
```

La nueva contraseña debe tener al menos **6 caracteres**.

**Respuesta `200`**

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

---

#### `GET /api/usuario/perfil`

Devuelve el perfil del usuario autenticado.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Respuesta `200`**

```json
{
  "message": "perfil encontrado",
  "usuario": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
    "nombre": "Ricardo",
    "apellido": "Jaraba",
    "documento": "1000100011",
    "telefono": "3001234567",
    "correo": "admin@sgp.com",
    "placas": ["ABC-123"],
    "rol": "administrador"
  }
}
```

---

### Organizaciones (sedes)

#### `POST /api/organizacion`

Crea una sede. Requiere token de **administrador**.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "nombre": "Parqueadero Centro",
  "nit": "901234567-8",
  "tipoEntidad": "Comercial",
  "direccion": "Calle 50 # 20-10",
  "descripcion": "Sede de prueba",
  "totalPuestos": 24,
  "limiteMiembros": 100,
  "zonaHoraria": "America/Bogota",
  "latitud": 6.2442,
  "longitud": -75.5812,
  "reservasPublicas": true,
  "cobroAutomatico": false,
  "cobroPorHora": false,
  "acceso24_7": true
}
```

- `tipoEntidad`: `Residencial`, `Comercial`, `Mixto`, `Publico` o `Privado`.
- `totalPuestos` y `limiteMiembros` deben ser enteros mayores que cero.
- `zonaHoraria` debe ser una zona IANA válida, por ejemplo `America/Bogota`.
- `latitud` y `longitud` se envían juntas o no se envían.
- Los campos booleanos son opcionales.

**Respuesta `201`**

```json
{
  "message": "organizacion creada",
  "organizacion": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
    "nombre": "Parqueadero Centro",
    "codigoInvitacion": "A1B2C3",
    "totalPuestos": 24,
    "limiteMiembros": 100,
    "zonaHoraria": "America/Bogota"
  }
}
```

El creador queda automáticamente como miembro de la sede.

---

#### `GET /api/organizacion`

Lista las sedes a las que pertenece el usuario autenticado.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Respuesta `200`**

```json
{
  "message": "organizaciones encontradas",
  "organizaciones": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
      "nombre": "Residencial Aguas del Bosque",
      "codigoInvitacion": "BOSQUE2026",
      "totalPuestos": 48
    }
  ]
}
```

---

#### `GET /api/organizacion/todas`

Lista todas las sedes del sistema. **No devuelve `codigoInvitacion`**.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Respuesta `200`**

```json
{
  "message": "organizaciones encontradas",
  "organizaciones": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
      "nombre": "Unilasallista",
      "tipoEntidad": "Comercial",
      "totalPuestos": 24
    }
  ]
}
```

---

#### `POST /api/organizacion/unirse`

Une al usuario autenticado a una sede mediante su código de invitación. **No está disponible para administradores**: una cuenta administradora solo administra las sedes que crea.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "codigoInvitacion": "UNILASALLISTA"
}
```

Códigos del seed: `BOSQUE2026` y `UNILASALLISTA`.

**Respuesta `201`**

```json
{
  "message": "se unio a la organizacion",
  "organizacion": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
    "nombre": "Unilasallista",
    "codigoInvitacion": "UNILASALLISTA"
  }
}
```

---

#### `GET /api/organizacion/:id/miembros`

Lista los miembros de una sede. Debes ser miembro o creador de la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**URL de ejemplo**

```http
GET http://localhost:2305/api/organizacion/65f1c2a9b7d4e8a1c2d3e4f5/miembros
```

**Respuesta `200`**

```json
{
  "message": "miembros encontrados",
  "miembros": [
    {
      "membresia": "65f1c2a9b7d4e8a1c2d3e4f6",
      "usuario": {
        "_id": "65f1c2a9b7d4e8a1c2d3e4f7",
        "nombre": "Victor",
        "apellido": "Cordoba",
        "correo": "conductor@sgp.com",
        "rol": "usuario"
      }
    }
  ]
}
```

---

#### `PATCH /api/organizacion/:id`

Edita una sede. Solo puede hacerlo el **creador** de la organización.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

Puedes enviar uno o varios de estos campos:

```json
{
  "nombre": "Parqueadero Centro Norte",
  "direccion": "Carrera 45 # 10-20",
  "descripcion": "Sede actualizada",
  "totalPuestos": 30,
  "limiteMiembros": 120,
  "zonaHoraria": "America/Bogota",
  "latitud": 6.2500,
  "longitud": -75.5700,
  "reservasPublicas": true,
  "cobroAutomatico": true,
  "cobroPorHora": false,
  "acceso24_7": true
}
```

- No puedes bajar `totalPuestos` por debajo de las casillas que ya existen.
- No puedes bajar `limiteMiembros` por debajo de los miembros actuales.

**Respuesta `200`**

```json
{
  "message": "organizacion actualizada",
  "organizacion": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f5",
    "nombre": "Parqueadero Centro Norte",
    "totalPuestos": 30
  }
}
```

---

### Casillas (plano del parqueadero)

Tipos permitidos: `standard`, `discapacitados`, `electrico`, `entrada`, `salida`, `carril`.

Solo `standard`, `discapacitados` y `electrico` cuentan como puestos.

#### `POST /api/casilla`

Crea un elemento del plano. Requiere token de **administrador** y que el usuario sea el **creador** de la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "organizacion": "65f1c2a9b7d4e8a1c2d3e4f5",
  "codigo": "A1",
  "seccion": "Sección A",
  "tipo": "standard",
  "posX": 120,
  "posY": 80,
  "rotacion": 0
}
```

- `organizacion`, `codigo` y `seccion` son obligatorios.
- `tipo` es opcional y por defecto es `standard`.
- `posX`, `posY` y `rotacion` son opcionales; por defecto valen `0`.
- No puede repetirse el mismo `codigo` dentro de la misma `seccion`.
- La casilla siempre se crea en estado `libre`.

**Respuesta `201`**

```json
{
  "message": "casilla creada",
  "casilla": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
    "organizacion": "65f1c2a9b7d4e8a1c2d3e4f5",
    "codigo": "A1",
    "seccion": "Sección A",
    "tipo": "standard",
    "estado": "libre",
    "posX": 120,
    "posY": 80,
    "rotacion": 0
  }
}
```

---

#### `GET /api/casilla/organizacion/:organizacionId`

Lista todas las casillas de una sede. Cualquier usuario autenticado puede consultarlas.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**URL de ejemplo**

```http
GET http://localhost:2305/api/casilla/organizacion/65f1c2a9b7d4e8a1c2d3e4f5
```

**Respuesta `200`**

```json
{
  "message": "casillas encontradas",
  "casillas": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
      "organizacion": "65f1c2a9b7d4e8a1c2d3e4f5",
      "codigo": "A1",
      "seccion": "Sección A",
      "tipo": "standard",
      "estado": "libre",
      "posX": 120,
      "posY": 80,
      "rotacion": 0
    }
  ]
}
```

---

#### `GET /api/casilla/todas`

Lista las casillas de todas las sedes con los campos básicos.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Respuesta `200`**

```json
{
  "message": "casillas encontradas",
  "casillas": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
      "organizacion": "65f1c2a9b7d4e8a1c2d3e4f5",
      "codigo": "A1",
      "seccion": "Sección A",
      "tipo": "standard",
      "estado": "libre"
    }
  ]
}
```

---

#### `PATCH /api/casilla/:id/estado`

Cambia una casilla entre `libre` y `ocupado`. Requiere token de **guardia o administrador** y pertenecer a la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "estado": "ocupado"
}
```

Valores permitidos: `libre`, `ocupado`.

**Respuesta `200`**

```json
{
  "message": "estado actualizado",
  "casilla": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
    "estado": "ocupado"
  }
}
```

Si la casilla tiene una reserva activa, no se puede pasar a `libre` hasta finalizar la reserva.

---

#### `PATCH /api/casilla/:id` y `PUT /api/casilla/:id`

Edita una casilla. Solo puede hacerlo el **creador** de la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

Puedes enviar uno o varios de estos campos:

```json
{
  "codigo": "A2",
  "seccion": "Sección A",
  "tipo": "electrico",
  "estado": "libre",
  "posX": 200,
  "posY": 140,
  "rotacion": 90
}
```

**Respuesta `200`**

```json
{
  "message": "casilla actualizada",
  "casilla": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
    "codigo": "A2",
    "tipo": "electrico",
    "posX": 200,
    "posY": 140,
    "rotacion": 90
  }
}
```

---

#### `DELETE /api/casilla/:id`

Elimina una casilla. Requiere token de **administrador** y ser el **creador** de la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**URL de ejemplo**

```http
DELETE http://localhost:2305/api/casilla/65f1c2a9b7d4e8a1c2d3e4f8
```

**Respuesta `200`**

```json
{
  "message": "casilla eliminada",
  "id": "65f1c2a9b7d4e8a1c2d3e4f8"
}
```

No se puede eliminar una casilla con una reserva activa.

---

### Reservas

#### `POST /api/reserva`

Crea una reserva. Requiere token.

**Headers**

```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "casilla": "65f1c2a9b7d4e8a1c2d3e4f8",
  "placa": "XYZ-789",
  "duracionHoras": 2
}
```

- `casilla` debe estar en estado `libre`.
- `duracionHoras` debe ser un entero mayor que cero.
- Si la sede no tiene `reservasPublicas`, el usuario debe ser miembro.
- Un usuario solo puede tener **una reserva activa por sede**. Si intenta crear otra, recibe `409`.

**Respuesta `201`**

```json
{
  "message": "reserva creada",
  "reserva": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f9",
    "casilla": "65f1c2a9b7d4e8a1c2d3e4f8",
    "organizacion": "65f1c2a9b7d4e8a1c2d3e4f5",
    "usuario": "65f1c2a9b7d4e8a1c2d3e4f7",
    "placa": "XYZ-789",
    "duracionHoras": 2,
    "estado": "activa"
  }
}
```

**Respuesta `409` si ya hay una reserva activa**

```json
{
  "message": "Ya tienes una reserva activa en esta sede. Finalizala antes de reservar otro puesto."
}
```

---

#### `PATCH /api/reserva/:id/finalizar`

Finaliza una reserva y deja la casilla en `libre`. Puede hacerlo el dueño de la reserva o un guardia/administrador que pertenezca a la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Body:** no requiere body.

**URL de ejemplo**

```http
PATCH http://localhost:2305/api/reserva/65f1c2a9b7d4e8a1c2d3e4f9/finalizar
```

**Respuesta `200`**

```json
{
  "message": "reserva finalizada",
  "reserva": {
    "_id": "65f1c2a9b7d4e8a1c2d3e4f9",
    "estado": "finalizada"
  }
}
```

---

#### `GET /api/reserva/propias`

Lista todas las reservas del usuario autenticado, activas y finalizadas.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**Respuesta `200`**

```json
{
  "message": "reservas encontradas",
  "reservas": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f9",
      "casilla": "65f1c2a9b7d4e8a1c2d3e4f8",
      "placa": "XYZ-789",
      "duracionHoras": 2,
      "estado": "activa"
    }
  ]
}
```

---

#### `GET /api/reserva/organizacion/:organizacionId/alertas`

Lista las reservas activas que ya pasaron su hora de fin. Requiere token de **guardia o administrador** y pertenecer a la sede.

**Headers**

```http
Authorization: Bearer <TOKEN>
```

**URL de ejemplo**

```http
GET http://localhost:2305/api/reserva/organizacion/65f1c2a9b7d4e8a1c2d3e4f5/alertas
```

**Respuesta `200`**

```json
{
  "message": "alertas encontradas",
  "zonaHoraria": "America/Bogota",
  "alertas": [
    {
      "_id": "65f1c2a9b7d4e8a1c2d3e4f9",
      "placa": "XYZ-789",
      "casilla": {
        "_id": "65f1c2a9b7d4e8a1c2d3e4f8",
        "codigo": "A1",
        "seccion": "Sección A"
      },
      "usuario": {
        "_id": "65f1c2a9b7d4e8a1c2d3e4f7",
        "nombre": "Victor",
        "apellido": "Cordoba",
        "telefono": "3105556677"
      },
      "duracionHoras": 2,
      "horaInicio": "2026-11-10 08:00",
      "horaFin": "2026-11-10 10:00",
      "horasVencidas": 1,
      "horasExcedidas": 1.2,
      "zonaHoraria": "America/Bogota"
    }
  ]
}
```

---

## Guía de Pruebas en Postman

Esta guía no usa **Environments** ni variables de Postman. Solo crea una request, pega la URL, agrega los headers y el body, y pulsa **Send**.

### 1. Preparar el servidor

```bash
npm install
npm run seed
npm start
```

El servidor queda en `http://localhost:2305`.

### 2. Crear una request en Postman

1. Abre Postman y pulsa **New > HTTP Request**.
2. Selecciona el método: `GET`, `POST`, `PATCH`, `PUT` o `DELETE`.
3. Pega la URL, por ejemplo `http://localhost:2305/api/usuario/login`.
4. En la pestaña **Headers**, agrega:
   - `Content-Type` con valor `application/json` para `POST`, `PATCH` y `PUT`.
   - `Authorization` con valor `Bearer <TOKEN>` en las rutas protegidas.
5. En la pestaña **Body**, selecciona **raw** y luego **JSON**.
6. Pega el body de ejemplo y pulsa **Send**.

> Reemplaza `<TOKEN>` por el token real que devuelve el login. El token vence a los 60 minutos; si recibes `401`, vuelve a iniciar sesión y copia uno nuevo.

### 3. Flujo rápido de prueba

Sigue este orden para probar todo sin enredarte con los IDs:

1. **Login como administrador**
   - `POST http://localhost:2305/api/usuario/login`
   - Body: `{"correo":"admin@sgp.com","password":"123456"}`
   - Copia el `token`.

2. **Ver el perfil**
   - `GET http://localhost:2305/api/usuario/perfil`
   - Header: `Authorization: Bearer <TOKEN>`

3. **Listar las sedes del administrador**
   - `GET http://localhost:2305/api/organizacion`
   - Copia el `_id` de una sede, por ejemplo la de **Unilasallista**.

4. **Listar las casillas de esa sede**
   - `GET http://localhost:2305/api/casilla/organizacion/<ID_ORGANIZACION>`
   - Copia el `_id` de una casilla con `"estado": "libre"`.

5. **Login como conductor**
   - `POST http://localhost:2305/api/usuario/login`
   - Body: `{"correo":"conductor@sgp.com","password":"123456"}`
   - Copia el nuevo `token`.

6. **Crear una reserva**
   - `POST http://localhost:2305/api/reserva`
   - Headers: `Authorization: Bearer <TOKEN>` y `Content-Type: application/json`
   - Body:

   ```json
   {
     "casilla": "<ID_CASILLA_LIBRE>",
     "placa": "XYZ-789",
     "duracionHoras": 2
   }
   ```

   > El seed deja al conductor con reservas activas en **Aguas del Bosque**. Para probar una reserva nueva usa una casilla libre de **Unilasallista**, o finaliza todas sus reservas activas en Aguas del Bosque.

7. **Consultar las reservas propias**
   - `GET http://localhost:2305/api/reserva/propias`
   - Header: `Authorization: Bearer <TOKEN>`
   - Copia el `_id` de la reserva creada.

8. **Intentar reservar otra casilla en la misma sede**
   - Repite el `POST /api/reserva` con otra casilla libre de la misma sede.
   - Debe responder `409` con el mensaje de reserva activa.

9. **Finalizar la reserva**
   - `PATCH http://localhost:2305/api/reserva/<ID_RESERVA>/finalizar`
   - Header: `Authorization: Bearer <TOKEN>`
   - No lleva body.
   - La casilla debe quedar en `libre`.

10. **Probar alertas como guardia**
    - Login con `guardia@sgp.com` / `123456`.
    - Usa el `_id` de **Aguas del Bosque**, que ya tiene reservas vencidas por el seed.
    - `GET http://localhost:2305/api/reserva/organizacion/<ID_AGUAS_DEL_BOSQUE>/alertas`
    - Header: `Authorization: Bearer <TOKEN>`

### 4. Pruebas de administración

Con el token del administrador:

| Prueba | Método y URL | Body |
|---|---|---|
| Crear sede | `POST /api/organizacion` | Ver ejemplo de creación de organización |
| Editar sede | `PATCH /api/organizacion/<ID_ORGANIZACION>` | `{"nombre":"Sede actualizada"}` |
| Listar miembros | `GET /api/organizacion/<ID_ORGANIZACION>/miembros` | Sin body |
| Crear casilla | `POST /api/casilla` | `{"organizacion":"<ID_ORGANIZACION>","codigo":"Z1","seccion":"Sección Z","tipo":"standard"}` |
| Editar casilla | `PATCH /api/casilla/<ID_CASILLA>` | `{"codigo":"Z2","posX":100,"posY":50}` |
| Cambiar estado | `PATCH /api/casilla/<ID_CASILLA>/estado` | `{"estado":"ocupado"}` |
| Eliminar casilla | `DELETE /api/casilla/<ID_CASILLA>` | Sin body |
| Ver todas las sedes | `GET /api/organizacion/todas` | Sin body |
| Ver todas las casillas | `GET /api/casilla/todas` | Sin body |

### 5. Pruebas de usuarios

| Prueba | Método y URL | Body |
|---|---|---|
| Registrar usuario | `POST /api/usuario/registrar` | Ver ejemplo de registro |
| Ver disponibilidad | `GET /api/usuario/disponible?correo=nuevo@correo.com&documento=1000600066` | Sin body |
| Recuperar contraseña | `POST /api/usuario/recuperar` | `{"correo":"conductor@sgp.com","documento":"1000300033","password":"123456"}` |
| Unirse a una sede | `POST /api/organizacion/unirse` | `{"codigoInvitacion":"UNILASALLISTA"}`. Solo para conductores o guardias; el administrador recibe `403`. |

### 6. Errores comunes en Postman

| Respuesta | Causa probable | Solución |
|---|---|---|
| `401 No autorizado` | Falta el header `Authorization` o el token venció | Envía `Authorization: Bearer <TOKEN>` con un token nuevo |
| `403 No autorizado, se requiere rol...` | El usuario no tiene el rol necesario | Usa `admin@sgp.com` o `guardia@sgp.com` según la ruta |
| `403 Solo el creador...` | Estás usando otra cuenta aunque seas administrador | Usa la cuenta que creó la sede |
| `400 Id invalido` | El ID no es un ObjectId válido de MongoDB | Copia el `_id` completo devuelto por la API |
| `415 El Content-Type debe ser application/json` | Enviaste body sin el header correcto | Agrega `Content-Type: application/json` |
| `409 Ya tienes una reserva activa...` | El usuario ya tiene una reserva activa en esa sede | Finaliza la reserva con `PATCH /api/reserva/:id/finalizar` |

---

## Códigos de Respuesta y Errores

Todas las respuestas de la API son **JSON**, incluidos los errores. El backend usa estos códigos:

| Código | Cuándo se usa |
|---|---|
| `200 OK` | Consulta o actualización exitosa |
| `201 Created` | Registro de usuario, organización, casilla o reserva creado |
| `400 Bad Request` | Datos faltantes, inválidos, JSON mal formado o regla de negocio incumplida |
| `401 Unauthorized` | Token ausente, inválido, vencido o credenciales incorrectas |
| `403 Forbidden` | El usuario está autenticado pero no tiene permisos |
| `404 Not Found` | Recurso o ruta de API inexistente |
| `409 Conflict` | Duplicado detectado por MongoDB o el usuario ya tiene una reserva activa en esa sede |
| `413 Payload Too Large` | El cuerpo supera el límite de `1mb` |
| `415 Unsupported Media Type` | El cuerpo no se envió como `application/json` |
| `500 Internal Server Error` | Fallo inesperado del servidor (sin exponer detalles técnicos) |

Formato de error:

```json
{ "message": "Descripción del error" }
```

Cuando aplica, se agrega `detalles`:

```json
{
  "message": "Los datos enviados no son validos",
  "detalles": [{ "campo": "correo", "mensaje": "..." }]
}
```

---

## Notas Importantes

- **Estructura limpia**: El código está separado en `backend/` (Express + MongoDB + Socket.io) y `frontend/` (Angular + Tailwind). El backend mantiene `app.js` (configuración) y `server.js` (arranque), con sus carpetas `routes/`, `controllers/`, `models/`, `helpers/` y `middlewares/`.
- **Errores centralizados**: `backend/middlewares/errores.js` convierte cualquier error (JSON inválido, validación de Mongoose, duplicados, etc.) en una respuesta JSON con su código HTTP. `backend/middlewares/validarCuerpo.js` valida el cuerpo y el `Content-Type` antes de llegar a los controladores.
- **JWT**: El secreto se lee de `JWT_SECRET`. Si no está definido, se usa `"abc"` solo como valor de desarrollo.
- **Móvil automático**: Los `environments` usan `Capacitor.isNativePlatform()` para decidir si usar rutas relativas o la IP de tu PC.
- **HTTP en red local**: Se añadió `android:usesCleartextTraffic="true"` y `network_security_config.xml` para permitir conexión HTTP con tu servidor local.
- **WebSockets**: Funcionan tanto en web (`/`) como en móvil apuntando a `http://IP:2305`
- **Si no hay build de Angular**: Al acceder a `/` sin `dist/frontend/browser`, el servidor mostrará un mensaje indicando que debes compilar con `npm run build`.
- **Cambios en red WiFi**: **SIEMPRE** correr `npm run build:mobile` después de cambiar de red.
