# Endpoints - Organización

Base path: `/api/organizacion`

Gestión de sedes/parqueaderos, miembros y códigos de invitación.

## 1. Crear Organización

Crea una nueva organización/sede. **Solo administradores** pueden crearla.

- **URL:** `POST /api/organizacion`
- **Auth:** Requiere token + rol `administrador`
- **Content-Type:** `application/json`

### Body

```json
{
  "nombre": "Parqueadero Unilasallista",
  "nit": "900123456-7",
  "tipoEntidad": "Universidad",
  "direccion": "Calle 123 #45-67",
  "descripcion": "Parqueadero principal",
  "totalPuestos": 50,
  "limiteMiembros": 100,
  "zonaHoraria": "America/Bogota",
  "reservasPublicas": true,
  "cobroAutomatico": false,
  "cobroPorHora": true,
  "acceso24_7": true
}
```

### Respuestas

**201 Created**
```json
{
  "message": "Organizacion creada correctamente",
  "organizacion": {
    "_id": "66f...",
    "nombre": "Parqueadero Unilasallista",
    "nit": "900123456-7",
    "codigoInvitacion": "ABC123XY",
    "creadoPor": "66f...",
    ...
  }
}
```

**401 Unauthorized** - Sin token o token inválido  
**403 Forbidden** - Token válido pero rol no es administrador  
**500 Internal Server Error**

## 2. Mis Organizaciones

Lista las organizaciones a las que pertenece el usuario autenticado.

- **URL:** `GET /api/organizacion`
- **Auth:** Requiere token
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Organizaciones encontradas",
  "organizaciones": [
    {
      "_id": "66f...",
      "nombre": "Parqueadero Unilasallista",
      "direccion": "Calle 123 #45-67",
      "codigoInvitacion": "ABC123XY",
      "totalPuestos": 50,
      ...
    }
  ]
}
```

**401 Unauthorized**  
**500 Internal Server Error**

## 3. Unirse a Organización

Unirse a una organización usando el código de invitación.

- **URL:** `POST /api/organizacion/unirse`
- **Auth:** Requiere token
- **Content-Type:** `application/json`

### Body

```json
{
  "codigoInvitacion": "ABC123XY"
}
```

### Respuestas

**201 Created**
```json
{
  "message": "Te has unido correctamente a la organización",
  "organizacion": { ... }
}
```

**400 Bad Request**
```json
{ "message": "Debes enviar el codigo de invitacion" }
{ "message": "Ya te encuentras unido a esta organización" }
```

**404 Not Found**
```json
{ "message": "Código de invitación inválido" }
```

**401 Unauthorized**  
**500 Internal Server Error**

## 4. Listar Miembros

Lista los miembros de una organización. Requiere estar autenticado y pertenecer a la organización.

- **URL:** `GET /api/organizacion/:id/miembros`
- **Auth:** Requiere token
- **Params:** `id` (ObjectId de la organización)
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Miembros encontrados",
  "miembros": [
    {
      "_id": "66f...",
      "nombre": "Juan",
      "apellido": "Pérez",
      "correo": "juan.perez@email.com",
      "telefono": "3001234567",
      "rol": "usuario",
      "placas": ["ABC123"]
    },
    {
      "_id": "66f...",
      "nombre": "Carlos",
      "apellido": "González",
      "correo": "carlos@email.com",
      "rol": "guardia"
    }
  ]
}
```

**401 Unauthorized**  
**404 Not found** - Organización no encontrada o usuario no pertenece  
**500 Internal Server Error**

## 5. Editar Organización

Edita los datos de la organización. Requiere estar autenticado.

- **URL:** `PATCH /api/organizacion/:id`
- **Auth:** Requiere token
- **Params:** `id` (ObjectId de la organización)
- **Content-Type:** `application/json`

### Body (campos opcionales)

```json
{
  "nombre": "Nuevo nombre",
  "direccion": "Nueva dirección",
  "descripcion": "Nueva descripción",
  "totalPuestos": 60,
  "limiteMiembros": 150,
  "reservasPublicas": true,
  "cobroAutomatico": true,
  "acceso24_7": false
}
```

### Respuestas

**200 OK**
```json
{
  "message": "Organizacion actualizado correctamente",
  "organizacion": { ... }
}
```

**401 Unauthorized**  
**404 Not Found** - Organización not found  
**500 Internal Server Error**

## 6. Todas las Organizaciones (buscador global)

Lista todas las sedes creadas en el sistema para el buscador global. No incluye `codigoInvitacion`.

- **URL:** `GET /api/organizacion/todas`
- **Auth:** Requiere token
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Organizaciones encontradas",
  "organizaciones": [
    {
      "_id": "66f...",
      "nombre": "Parqueadero Unilasallista",
      "direccion": "Calle 123 #45-67",
      "totalPuestos": 50
    }
  ]
}
```

**401 Unauthorized**
**500 Internal Server Error**
