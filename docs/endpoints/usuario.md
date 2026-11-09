# Endpoints - Usuario

Base path: `/api/usuario`

Todos los endpoints relacionados con autenticación, registro y perfil de usuario.

## 1. Registrar Usuario

Crea una nueva cuenta de usuario.

- **URL:** `POST /api/usuario/registrar`
- **Auth:** No requiere
- **Content-Type:** `application/json`

### Body

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "1234567890",
  "telefono": "3001234567",
  "correo": "juan.perez@email.com",
  "password": "123456",
  "placas": ["ABC123", "XYZ789"],  // Opcional
  "rol": "usuario"                  // Opcional: 'administrador' | 'guardia' | 'usuario' (default: 'usuario')
}
```

### Validaciones

| Campo | Requerido | Validación |
|---|---|---|
| `nombre` | Sí | Texto válido |
| `apellido` | Sí | Texto válido |
| `documento` | Sí | Texto válido (único) |
| `telefono` | Sí | Exactamente 10 dígitos numéricos |
| `correo` | Sí | Formato válido con `@` y `.` (único, se guarda en minúsculas) |
| `password` | Sí | Texto válido |
| `placas` | No | Debe ser array de textos si se envía |
| `rol` | No | Debe ser `administrador`, `guardia` o `usuario` |

### Respuestas

**201 Created**
```json
{
  "message": "usuario creado",
  "usuario": {
    "_id": "66f...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "1234567890",
    "telefono": "3001234567",
    "correo": "juan.perez@email.com",
    "placas": ["ABC123"],
    "rol": "usuario"
    // password NO se devuelve
  }
}
```

**400 Bad Request** - Faltan datos / formato inválido / duplicados
```json
{ "message": "Faltan datos obligatorios del usuario" }
{ "message": "Ya existe un usuario registrado con ese correo" }
{ "message": "Ya existe un usuario registrado con ese documento" }
{ "message": "El telefono debe tener exactamente 10 digitos" }
{ "message": "El rol debe ser administrador, guardia o usuario" }
```

**500 Internal Server Error**
```json
{ "message": "Error al crear el usuario" }
```

## 2. Login Usuario

Autentica al usuario y devuelve un token JWT.

- **URL:** `POST /api/usuario/login`
- **Auth:** No requiere
- **Content-Type:** `application/json`

### Body

```json
{
  "correo": "juan.perez@email.com",
  "password": "123456"
}
```

### Validaciones

| Campo | Requerido | Validación |
|---|---|---|
| `correo` | Sí | Texto válido |
| `password` | Sí | Texto válido |

### Respuestas

**200 OK**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NmY..."
}
```

**400 Bad Request**
```json
{ "message": "Debe enviar un correo y password de tipo texto" }
```

**401 Unauthorized**
```json
{ "message": "Correo o contraseña incorrectos" }
```

**500 Internal Server Error**
```json
{ "message": "Error al loguear el usuario" }
```

## 3. Perfil Usuario

Obtiene la información del usuario autenticado.

- **URL:** `GET /api/usuario/perfil`
- **Auth:** Requiere `Authorization: Bearer <token>`
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "perfil encontrado",
  "usuario": {
    "_id": "66f...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "1234567890",
    "telefono": "3001234567",
    "correo": "juan.perez@email.com",
    "placas": ["ABC123"],
    "rol": "usuario"
  }
}
```

**401 Unauthorized**
```json
{ "message": "No autorizado, debe iniciar sesion" }
```

**404 Not Found**
```json
{ "message": "Usuario no encontrado" }
```

**500 Internal Server Error**
```json
{ "message": "Error al consultar the perfil" }
```
