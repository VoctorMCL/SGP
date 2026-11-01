# Modelos de Datos

Todos los modelos están definidos con **Mongoose** en `server/models/`. Los nombres de colección en MongoDB se indican entre paréntesis.

## Usuario (`usuarios`)

**Archivo:** `server/models/usuario.js`

```js
{
  nombre: String,
  apellido: String,
  documento: String,
  telefono: String,
  correo: String,
  password: String,  // Almacenado con bcrypt (hash)
  placas: [String],  // Placas del vehículo registradas por el usuario
  rol: String         // 'administrador' | 'guardia' | 'usuario'
}
```

**Notas:**
- `correo` se guarda en minúsculas al registrar
- `password` **nunca** se devuelve en las respuestas (se elimina con `delete datos.password`)
- `rol` por defecto es `usuario` si no se especifica

## Organización (`organizaciones`)

**Archivo:** `server/models/organizacion.js`

```js
{
  nombre: String,
  nit: String,
  tipoEntidad: String,
  direccion: String,
  descripcion: String,
  totalPuestos: Number,
  limiteMiembros: Number,
  zonaHoraria: String,
  reservasPublicas: Boolean,
  cobroAutomatico: Boolean,
  cobroPorHora: Boolean,
  acceso24_7: Boolean,
  codigoInvitacion: String,        // Código para que otros usuarios se unan
  creadoPor: { type: ObjectId, ref: "usuarios" }
}
```

**Notas:**
- `codigoInvitacion` se usa en el endpoint `POST /api/organizacion/unirse`
- `creadoPor` referencia al usuario que creó la organización

## Casilla (`casillas`)

**Archivo:** `server/models/casilla.js`

```js
{
  organizacion: { type: ObjectId, ref: "organizaciones" },
  codigo: String,      // Código identificador de la casilla (ej. A-01, B-12)
  seccion: String,     // Sección/zona donde se ubica
  tipo: String,        // Tipo de casilla
  estado: String,      // Estado actual (ver valores abajo)
  posX: { type: Number, default: 0 },  // Posición X para el mapa interactivo
  posY: { type: Number, default: 0 },  // Posición Y para el mapa interactivo
  rotacion: { type: Number, default: 0 } // Rotación para el mapa interactivo
}
```

**Estados posibles de una casilla:**
- `libre` - Disponible para reservar
- `ocupado` - Actualmente ocupada
- `reservado` - Reservada pero aún no ocupada
- `mantenimiento` / otros según lógica de negocio

## Reserva (`reservas`)

**Archivo:** `server/models/reserva.js`

```js
{
  casilla: { type: ObjectId, ref: "casillas" },
  organizacion: { type: ObjectId, ref: "organizaciones" },
  usuario: { type: ObjectId, ref: "usuarios" },
  placa: String,
  horaInicio: Date,
  duracionHoras: Number,
  estado: String  // Estado de la reserva
}
```

**Notas:**
- `casilla`, `organizacion` y `usuario` son referencias a sus respectivos modelos
- Se usa para llevar el historial de reservas y para generar alertas
- `horaInicio` permite calcular vencimientos y alertas por tiempo

## Relaciones

- Un **Usuario** puede pertenecer a una o más organizaciones (lógica manejada en la aplicación)
- Una **Organización** tiene muchas **Casillas**
- Una **Casilla** pertenece a una **Organización**
- Una **Reserva** vincula **Usuario**, **Casilla** y **Organización**
- Un **Usuario** puede tener varias **placas** registradas
