# Endpoints - Reserva

Base path: `/api/reserva`

Gestión de reservas de casillas, reservas propias y alertas para staff.

## 1. Crear Reserva

Crea una nueva reserva para una casilla. Requiere estar autenticado.

- **URL:** `POST /api/reserva`
- **Auth:** Requiere token
- **Content-Type:** `application/json`

### Body

```json
{
  "casilla": "66f...",        // ObjectId de la casilla
  "organizacion": "66f...",   // ObjectId de la organización
  "placa": "ABC123",
  "duracionHoras": 2
}
```

### Respuestas

**201 Created**
```json
{
  "message": "Reserva creada correctamente",
  "reserva": {
    "_id": "66f...",
    "casilla": "66f...",
    "organizacion": "66f...",
    "usuario": "66f...",
    "placa": "ABC123",
    "horaInicio": "2025-10-26T10:30:00.000Z",
    "duracionHoras": 2,
    "estado": "activa"
  }
}
```

**400 Bad Request**
```json
{ "message": "Faltan datos para crear la reserva" }
{ "message": "La casilla ya se encuentra ocupada/reservada" }
```

**401 Unauthorized**  
**500 Internal Server Error**

## 2. Finalizar Reserva

Finaliza una reserva activa. Requiere estar autenticado.

- **URL:** `PATCH /api/reserva/:id/finalizar`
- **Auth:** Requiere token
- **Params:** `id` (ObjectId de la reserva)
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Reserva finalizada correctamente",
  "reserva": {
    "_id": "66f...",
    "estado": "finalizada",
    ...
  }
}
```

**404 Not Found**
```json
{ "message": "Reserva no encontrada" }
```

**401 Unauthorized**  
**500 Internal Server Error**

## 3. Mis Reservas

Lista las reservas del usuario autenticado (historial + activas).

- **URL:** `GET /api/reserva/propias`
- **Auth:** Require token
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Reservas encontradas",
  "reservas": [
    {
      "_id": "66f...",
      "casilla": {
        "_id": "66f...",
        "codigo": "A-01",
        "seccion": "A"
      },
      "organizacion": {
        "_id": "66f...",
        "nombre": "Parqueadero Unilasallista"
      },
      "usuario": "66f...",
      "placa": "ABC123",
      "horaInicio": "2025-10-26T10:30:00.000Z",
      "duracionHoras": 2,
      "estado": "activa"
    }
  ]
}
```

**401 Unauthorized**  
**500 Internal Server Error**

## 4. Alertas de Organización

Obtiene alertas de reservas para una organización. **Requiere rol guardia o administrador**.

- **URL:** `GET /api/reserva/organizacion/:organizacionId/alertas`
- **Auth:** Requiere token + rol `guardia` o `administrador`
- **Params:** `organizacionId` (ObjectId de la organización)
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Alertas encontradas",
  "alertas": [
    {
      "_id": "66f...",
      "reserva": "66f...",
      "casilla": {
        "codigo": "A-01",
        "seccion": "A"
      },
      "usuario": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "telefono": "3001234567"
      },
      "placa": "ABC123",
      "horaInicio": "2025-10-26T10:30:00.000Z",
      "duracionHoras": 2,
      "estado": "activa",
      "tiempoRestante": "00:45:00",
      "tipoAlerta": "proximo_vencer"
    }
  ]
}
```

**401 Unauthorized**  
**403 Forbidden** - Requiere rol guardia or administrador  
**500 Internal Server Error**
