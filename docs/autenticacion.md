# Autenticación y Roles

El sistema usa **JWT (JSON Web Tokens)** para autenticar usuarios. Los tokens se generan con `jwt-simple` y tienen una duración de **60 minutos**.

## Flujo de Autenticación

1. El usuario se registra o inicia sesión
2. El backend genera un token JWT con `auth.crearToken()`
3. El cliente envía el token en el header `Authorization: Bearer <token>`
4. El middleware `validarToken` decodifica y verifica el token, inyectando `req.usuario = { id, rol }`
5. Los middlewares de autorización validan el rol según el endpoint

## Generación de Token

**Archivo:** `backend/helpers/auth.js`

```js
let payload = {
    sub: usuario._id,
    correo: usuario.correo,
    rol: usuario.rol,
    iat: moment().unix(),
    exp: moment().add(60, 'minutes').unix()
}
return jwt.encode(payload, secret)
```

- **Secreto actual:** `"abc"` (hardcodeado)
- **Expiración:** 60 minutos

## Middlewares

| Middleware | Archivo | Descripción |
|---|---|---|
| `validarToken` | `backend/helpers/auth.js` | Verifica que el token sea válido. Extrae `id` y `rol` del payload y los guarda en `req.usuario`. Retorna `401` si es inválido o falta. |
| `validarAdministrador` | `backend/helpers/auth.js` | Requiere que `req.usuario.rol === 'administrador'`. Retorna `403` si no lo es. |
| `validarGuardiaOAdmin` | `backend/helpers/auth.js` | Requiere `rol === 'guardia'` o `rol === 'administrador'`. Retorna `403` si no cumple. |
| `esStaff(rol)` | `backend/helpers/auth.js` | Función helper para verificar si un rol es staff (guardia o administrador). |

## Roles del Sistema

| Rol | Descripción | Permisos |
|---|---|---|
| `administrador` | Propietario/administrador de la organización/sede | Crear organización, crear/editar/eliminar casillas, gestionar organización, ver alertas, cambiar estado de casillas |
| `guardia` | Personal de control/acceso al parqueadero | Cambiar estado de casillas, ver alertas de la organización, finalizar reservas |
| `usuario` (conductor) | Usuario común/conductor | Registrarse, unirse a organización con código, crear reservas, ver sus propias reservas, ver mapa de casillas |

## Cómo enviar el token

En todas las peticiones protegidas, incluir el header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Errores Comunes

| Código | Mensaje | Cuándo ocurre |
|---|---|---|
| `401` | `No autorizado, debe iniciar sesion` | Token ausente, malformado o inválido |
| `403` | `No autorizado, se requiere rol administrador` | Usuario autenticado pero sin rol administrador |
| `403` | `No autorizado, se requiere rol guardia o administrador` | Usuario autenticado pero no es staff |
| `404` | `No existe el usuario` | Al hacer login con correo no registrado |
| `401` | `Contraseña incorrecta` | Al hacer login con contraseña errónea |
