# Endpoints - Casilla

Base path: `/api/casilla`

Gestión de puestos/casillas del parqueadero. Incluye creación, listado, cambio de estado y eliminación.

## 1. Crear Casilla

Crea una nueva casilla en una organización. **Solo administradores** pueden crearla.

- **URL:** `POST /api/casilla`
- **Auth:** Requiere token + rol `administrador`
- **Content-Type:** `application/json`

### Body

```json
{
  "organizacion": "66f...",  // ObjectId de la organización
  "codigo": "A-01",
  "seccion": "A",
  "tipo": "carro",          // o 'moto', 'bicicleta', etc.
  "estado": "libre",        // 'libre' | 'ocupado' | 'reservado' | 'mantenimiento'
  "posX": 100,
  "posY": 50,
  "rotacion": 0
}
```

### Respuestas

**201 Created**
```json
{
  "message": "Casilla creada correctamente",
  "casilla": {
    "_id": "66f...",
    "organizacion": "66f...",
    "codigo": "A-01",
    "seccion": "A",
    "tipo": "carro",
    "estado": "libre",
    "posX": 100,
    "posY": 50,
    "rotacion": 0
  }
}
```

**401 Unauthorized**  
**403 Forbidden** - Requiere rol administrador  
**500 Internal Server Error**

## 2. Listar Casillas por Organización

Lista todas las casillas de una organización. Requiere estar autenticado.

- **URL:** `GET /api/casilla/organizacion/:organizacionId`
- **Auth:** Requiere token
- **Params:** `organizacionId` (ObjectId de la organización)
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Casillas encontradas",
  "casillas": [
    {
      "_id": "66f...",
      "organizacion": "66f...",
      "codigo": "A-01",
      "seccion": "A",
      "tipo": "carro",
      "estado": "libre",
      "posX": 100,
      "posY": 50,
      "rotacion": 0
    },
    {
      "_id": "66f...",
      "codigo": "A-02",
      "estado": "ocupado",
      "posX": 150,
      "posY": 50,
      "rotacion": 0
    }
  ]
}
```

**401 Unauthorized**  
**500 Internal Server Error**

## 3. Cambiar Estado de Casilla

Cambia el estado de una casilla. **Requiere rol guardia o administrador**. Este endpoint es muy usado en tiempo real.

- **URL:** `PATCH /api/casilla/:id/estado`
- **Auth:** Requiere token + rol `guardia` o `administrador`
- **Params:** `id` (ObjectId de la casilla)
- **Content-Type:** `application/json`

### Body

```json
{
  "estado": "ocupado"  // 'libre' | 'ocupado' | 'reservado' | 'mantenimiento'
}
```

### Respuestas

**200 OK**
```json
{
  "message": "Estado de casilla actualizado",
  "casilla": {
    "_id": "66f...",
    "codigo": "A-01",
    "estado": "ocupado",
    ...
  }
}
```

**401 Unauthorized**  
**403 Forbidden** - Requiere rol guardia o administrador  
**404 Not Found** - Casilla no encontrada  
**500 Internal Server Error**

## 4. Editar Casilla

Edita los datos de una casilla. Requiere estar autenticado.

- **URL:** `PATCH /api/casilla/:id`
- **Auth:** Requiere token
- **Params:** `id` (ObjectId de la casilla)
- **Content-Type:** `application/json`

### Body (campos opcionales)

```json
{
  "codigo": "A-01-B",
  "seccion": "A",
  "tipo": "moto",
  "estado": "libre",
  "posX": 120,
  "posY": 60,
  "rotacion": 90
}
```

### Respuestas

**200 OK**
```json
{
  "message": "Casilla actualizada correctamente",
  "casilla": { ... }
}
```

**401 Unauthorized**  
**404 Not Found**  
**500 Internal Server Error**

## 5. Eliminar Casilla

Elimina una casilla. **Solo administradores** pueden eliminarla.

- **URL:** `DELETE /api/casilla/:id`
- **Auth:** Requiere token + rol `administrador`
- **Params:** `id` (ObjectId de la casilla)
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Casilla eliminada correctamente"
}
```

**401 Unauthorized**  
**403 Forbidden** - Requiere rol administrador  
**404 Not Found** - Casilla not found  
**500 Internal Server Error**

## 6. Listar Todas las Casillas (buscador global)

Lista las casillas de todas las sedes para el buscador global. Solo devuelve los campos necesarios para mostrar un resultado.

- **URL:** `GET /api/casilla/todas`
- **Auth:** Requiere token
- **Content-Type:** N/A

### Respuestas

**200 OK**
```json
{
  "message": "Casillas encontradas",
  "casillas": [
    {
      "_id": "66f...",
      "organizacion": "66f...",
      "codigo": "A-01",
      "seccion": "A",
      "tipo": "standard",
      "estado": "libre"
    }
  ]
}
```

**401 Unauthorized**
**500 Internal Server Error**
