# Sockets en Tiempo Real

El sistema usa **Socket.io** para mantener actualizado el mapa de parqueo en tiempo real. Cuando hay cambios en casillas o reservas, se emiten eventos a todos los clientes conectados a la sala de esa organización.

## Inicialización

**Archivo:** `server/helpers/socket.js`

Se inicializa desde `server/server.js`:
```js
let server = http.createServer(app);
socketHelper.init(server);
```

Configuración CORS:
```js
io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
});
```

## Cliente (Frontend)

**Archivo:** `src/app/core/services/socket.service.ts`

```js
this.socket = io(environment.socketUrl, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
```

- En **web**: `environment.socketUrl = '/'`
- En **móvil (nativo)**: `environment.socketUrl = 'http://IP_LOCAL:2305'`

## Eventos del Servidor

### Conexión
| Evento | Descripción |
|---|---|
| `connection` | Se dispara al conectar un cliente. Se loguea el `socket.id` |
| `disconnect` | Se dispara al desconectar un cliente |

### Salas por Organización
| Evento (Cliente → Servidor) | Payload | Descripción |
|---|---|---|
| `unirse:organizacion` | `organizacionId` (string) | El cliente se une a la sala `org_{organizacionId}` para recibir actualizaciones de esa organización |
| `salir:organizacion` | `organizacionId` (string) | El cliente abandona la sala `org_{organizacionId}` |

## Funciones Helper

**`emitirEvento(evento, datos, organizacionId)`**

Emite eventos a los clientes. Si se pasa `organizacionId`, emite a la sala específica **Y** también emite globalmente (`io.emit`).

```js
function emitirEvento(evento, datos, organizacionId) {
    if (!io) return;
    if (organizacionId) {
        io.to(`org_${organizacionId}`).emit(evento, datos);
        io.emit(evento, datos);
    } else {
        io.emit(evento, datos);
    }
}
```

## Uso Típico

1. El usuario entra al mapa de parqueo de una organización
2. El frontend llama a `socketService.unirseOrganizacion(organizacionId)`
3. Cuando un guardia/admin cambia el estado de una casilla o se crea/finaliza una reserva, el controlador/backend emite eventos vía `emitirEvento()`
4. Todos los clientes en esa sala reciben la actualización y actualizan el mapa en tiempo real sin recargar la página

## Debugging

En desarrollo puedes ver los logs en consola del servidor:
```
Cliente conectado a WebSocket: abc123
Socket abc123 unido a sala org_66f...
Cliente desconectado: abc123
```
