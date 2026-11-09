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
  "placas": ["ABC-123", "XYZ-789"], // Opcional
  "rol": "usuario"                  // Opcional: 'administrador' | 'guardia' | 'usuario' (default: 'usuario')
}
```

### Validaciones

| Campo | Requerido | Validación |
|---|---|---|
| `nombre` | Sí | Texto válido. Se normaliza a primera letra mayúscula y el resto minúscula |
| `apellido` | Sí | Texto válido. Se normaliza a primera letra mayúscula y el resto minúscula |
| `documento` | Sí | Texto válido (único, se recorta) |
| `telefono` | Sí | Exactamente 10 dígitos numéricos |
| `correo` | Sí | Formato válido con `@` y `.` (único, se guarda en minúsculas) |
| `password` | Sí | Texto válido |
| `placas` | No | Array de textos. Cada placa debe tener 3 letras y 3 números, con separador opcional espacio, `-` o `_` (ej. `ABC-123`, `ABC 123`, `ABC_123`, `ABC123`). Se guarda como `ABC-123` |
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
    "placas": ["ABC-123"],
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
{ "message": "Cada placa debe tener el formato ABC-123 (tres letras y tres numeros)" }
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
    "placas": ["ABC-123"],
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

## 4. Recuperar Contraseña

Restablece la contraseña de un usuario verificando su correo y su documento de identidad.

- **URL:** `POST /api/usuario/recuperar`
- **Auth:** No requiere
- **Content-Type:** `application/json`

### Body

```json
{
  "correo": "juan.perez@email.com",
  "documento": "1234567890",
  "password": "nuevaClave123"
}
```

### Validaciones

| Campo | Requerido | Validación |
|---|---|---|
| `correo` | Sí | Formato válido con `@` y `.` |
| `documento` | Sí | Debe coincidir con el documento registrado para ese correo |
| `password` | Sí | Texto de al menos 6 caracteres (nueva contraseña) |

### Respuestas

**200 OK**
```json
{ "message": "Contraseña actualizada correctamente" }
```

**400 Bad Request**
```json
{ "message": "Debe enviar correo, documento y la nueva contraseña" }
{ "message": "El correo no tiene un formato valido" }
{ "message": "La nueva contraseña debe tener al menos 6 caracteres" }
{ "message": "El correo y el documento no coinciden con ningún usuario" }
```

**500 Internal Server Error**
```json
{ "message": "Error al actualizar la contraseña" }
```

> La verificación se hace con correo + documento. Si ambos coinciden, la contraseña se reemplaza inmediatamente; no se envía ningún correo.

## 5. Verificar Disponibilidad

Comprueba si un correo y/o documento ya están registrados. Se usa durante la creación de cuenta para avisar antes de enviar el formulario. La validación definitiva sigue ocurriendo en `POST /api/usuario/registrar`.

- **URL:** `GET /api/usuario/disponible`
- **Auth:** No requiere
- **Query params:** `correo` y/o `documento` (opcionales; si se omite uno, se devuelve disponible)

### Ejemplo

```http
GET /api/usuario/disponible?correo=juan@email.com&documento=1234567890
```

### Respuestas

**200 OK**
```json
{
  "correoDisponible": false,
  "documentoDisponible": true
}
```

**500 Internal Server Error**
```json
{ "message": "Error al verificar la disponibilidad" }
```
