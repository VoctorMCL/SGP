# Arquitectura General

SGP es una aplicación **fullstack unificada**. Todo corre desde un solo proyecto con un solo servidor Express que sirve tanto la API como los archivos estáticos del frontend Angular.

## Stack Tecnológico

| Capa | Tecnología | Uso |
|---|---|---|
| **Frontend Web/Móvil** | Angular 22 + Tailwind CSS v4 | Interfaz de usuario |
| **Backend** | Express 5 (Node.js) | API REST + servidor unificado |
| **Base de Datos** | MongoDB + Mongoose 9 | Persistencia de datos |
| **Tiempo Real** | Socket.io 4 | Actualizaciones en tiempo real del mapa de parqueo |
| **Autenticación** | JWT (jwt-simple) + bcrypt | Login, registro y protección de rutas |
| **Móvil Nativo** | Capacitor 8 | Empaquetado para Android/iOS |
| **Utilidades** | moment/moment-timezone | Manejo de fechas/horas |

## Estructura Lógica

```
┌─────────────────┐
│   Cliente       │
│  (Angular Web)  │
│  o App Móvil    │
└─────────┬───────┘
          │ HTTP / WebSocket
          ▼
┌─────────────────────────────────┐
│        Servidor Express         │
│  ├── /api/*      → REST API     │
│  ├── /socket.io  → WebSockets   │
│  └── /           → Angular SPA  │
└─────────┬───────────────────────┘
          │ Mongoose
          ▼
        MongoDB
```

## Organización del Código

### Backend
- **`backend/app.js`** - Configuración pura de Express. Define middlewares, monta rutas, sirve estáticos de Angular y maneja el fallback SPA.
- **`backend/server.js`** - Arranque puro. Carga `.env`, conecta a MongoDB, crea servidor HTTP, inicializa Socket.io y pone a escuchar.
- **`backend/config/db.js`** - Función reutilizable para conectar a MongoDB.
- **`backend/routes/`** - Definición de rutas con sus respectivos middlewares de autenticación/autorización.
- **`backend/controllers/`** - Lógica de negocio por recurso.
- **`backend/models/`** - Esquemas Mongoose.
- **`backend/helpers/`** - Utilidades transversales (`auth.js`, `socket.js`, `validacion.js`, `respuestas.js`).
- **`backend/middlewares/`** - Validación del cuerpo/`Content-Type` y manejo central de errores con respuestas JSON y códigos HTTP coherentes.

### Frontend
- **`frontend/src/app/core/`** - Servicios, guards, interceptores y modelos compartidos.
- **`frontend/src/app/shared/`** - Componentes reutilizables.
- **`frontend/src/app/features/`** - Módulos/pantallas por funcionalidad (`auth`, `organizaciones`, `parqueadero-mapa`, `admin-dashboard`).
- **`frontend/src/environments/`** - Configuración dinámica de URLs para web vs nativo.

### Móvil
- **`capacitor.config.ts`** - Configuración base de Capacitor
- **`android/`** - Proyecto nativo generado por Capacitor
- **`scripts/set-mobile-ip.js`** - Detección automática de IP local para probar en celular en misma red WiFi
