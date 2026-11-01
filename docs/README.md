# Documentación Técnica - SGP (Sistema de Gestión de Parqueo)

Esta carpeta contiene la documentación técnica completa del proyecto. Está pensada para entender rápidamente el funcionamiento del sistema, sus endpoints, autenticación, modelos y flujos.

## Índice

- [Arquitectura General](./arquitectura.md) - Visión general del proyecto (Frontend Angular, Backend Express, MongoDB, Socket.io, Capacitor)
- [Variables de Entorno](./variables-entorno.md) - Configuración necesaria para correr localmente
- [Autenticación y Roles](./autenticacion.md) - JWT, middlewares, roles y permisos
- [Modelos de Datos](./modelos.md) - Esquemas Mongoose (Usuario, Organización, Casilla, Reserva)
- [Sockets en Tiempo Real](./sockets.md) - Eventos WebSocket y salas por organización
- [Casos de Uso](./casos-de-uso.md) - Flujos típicos por rol (Administrador, Guardia, Conductor/Usuario)
- [Endpoints API](./endpoints/) - Documentación detallada por módulo
  - [Usuario](./endpoints/usuario.md)
  - [Organización](./endpoints/organizacion.md)
  - [Casilla](./endpoints/casilla.md)
  - [Reserva](./endpoints/reserva.md)
