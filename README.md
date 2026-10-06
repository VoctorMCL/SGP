# SGP - Sistema de Gestion de Parqueo (Backend)

Backend desarrollado en **Node.js + Express + MongoDB**, probado 100% desde Postman (sin frontend),
implementando autenticacion por rol, organizaciones (parqueaderos) con invitacion por codigo,
mapa de casillas y reservas con alertas por tiempo excedido.

Son **16 endpoints** agrupados en cuatro recursos (`usuario`, `organizacion`, `casilla`,
`reserva`).

### Ubicacion del Codigo

El backend completo se encuentra distribuido en las siguientes carpetas, con el punto de entrada
en `index.js`:

| Carpeta | Que hay |
|---|---|
| `models/` | Los 5 esquemas de Mongoose |
| `controllers/` | Un archivo por recurso, con la logica de cada endpoint |
| `routes/` | Un archivo por recurso, con las rutas y los middlewares de acceso |
| `helpers/` | `auth.js` (crear y validar el token), `membresia.js` (`esMiembro`) y `validacion.js` (las reglas de tipo de datos) |
| `applications.js` | Arma la app de Express y conecta los middlewares con las rutas |

---

## Funcionalidades Implementadas

- **Registro y login de usuarios** – Password hasheado con `bcrypt`, autenticacion mediante token (`jwt-simple`), rol (`administrador` / `guardia` / `usuario`).
- **Perfil** – El usuario logueado puede consultar sus propios datos.
- **Organizaciones (parqueaderos)** – Un `administrador` crea la organizacion (define capacidad, zona horaria y permisos) y se genera un codigo de invitacion automatico.
- **Union por codigo** – Cualquier usuario puede unirse a una organizacion con el codigo, siempre que no haya alcanzado el limite de miembros.
- **Editar organizacion y listar miembros** – Solo el creador puede editarla; cualquier miembro (o el creador) puede ver quienes pertenecen.
- **Mapa de casillas** – El creador de la organizacion define y edita las casillas (codigo, seccion, tipo).
- **Marcar libre/ocupado** – Un `guardia` o `administrador` que pertenezca a la organizacion puede cambiar el estado de una casilla.
- **Reservas** – Un miembro puede reservar una casilla libre (o cualquiera si la organizacion tiene `reservasPublicas` activo), indicando placa y duracion en horas.
- **Alertas por tiempo excedido** – El `guardia`/`administrador` puede consultar que reservas activas ya superaron su `duracionHoras`, con las horas calculadas en el `zonaHoraria` de la organizacion.
- **Finalizacion de reservas con permiso por organizacion** – Un `guardia`/`administrador` solo puede finalizar reservas de organizaciones de las que es miembro; el dueno siempre puede.
- **Ids y referencias validadas** – Un id con formato invalido responde `400` (`Id invalido`) y una organizacion o casilla borrada responde `404`, sin tumbar el servidor.
- **Tipos de datos validados** – `helpers/validacion.js` revisa que los ids sean ObjectId, los numeros sean enteros mayores que cero, los booleanos sean `true`/`false`, los textos no esten vacios y la `zonaHoraria` exista. Si algo viene mal, responde `400` con un mensaje limpio y no se guarda nada.

---

## Tecnologias

| Paquete | Uso |
|---|---|
| express | Servidor y rutas |
| body-parser | Leer el JSON del body de las peticiones |
| mongoose | Modelado y acceso a MongoDB |
| bcrypt | Encriptacion de contraseñas |
| jwt-simple | Creacion y validacion de tokens |
| moment | Manejo de fechas (expiracion del token) |
| moment-timezone | Las alertas se calculan en el `zonaHoraria` de la organizacion |
| cors | Habilitar peticiones desde otros origenes |

---

## Instalacion

```
npm install
```

Asegurate de tener MongoDB corriendo en `mongodb://localhost:27017`.

## Ejecutar el proyecto

```
npm start
```

El servidor levanta en el puerto `2305` y usa la base de datos `parqueo`. En consola solo
imprime `Conexion exitosa`.

Para desarrollo, `npm run dev` reinicia el servidor cada vez que guardas un archivo.

Requiere Node.js 18 o superior (Express 5 no funciona en versiones anteriores). MongoDB 6 o
superior, corriendo en `mongodb://localhost:27017`.

---

## Roles y permisos

| Rol | Que puede hacer |
|---|---|
| `usuario` (por defecto) | Unirse a organizaciones, ver casillas, reservar, finalizar sus propias reservas, ver miembros de sus organizaciones |
| `guardia` | Lo anterior + cambiar el estado de casillas de las organizaciones donde es miembro, ver alertas, finalizar cualquier reserva **de esas organizaciones** |
| `administrador` | Puede crear organizaciones; editar/administrar casillas solo en las organizaciones que el mismo creo |

> **Editar no depende solo del rol, sino de ser el creador.** Solo quien creo una organizacion (su `_id` queda en `creadoPor`) puede editarla o administrar sus casillas. Un `administrador` que no la creo recibe `403`.

### Finalizar una reserva

`PATCH /api/reserva/:id/finalizar` deja pasar en dos casos, y solo en esos dos:

1. Eres el **dueño** de la reserva.
2. Tienes rol `guardia` o `administrador` **y perteneces a la organizacion** donde esta esa
   reserva.

Un `guardia` o `administrador` de otra organizacion recibe
`403` — `No puede finalizar esta reserva`. Un usuario normal que no es el dueno tambien.
Si perteneces a varias organizaciones, puedes finalizar en cualquiera de ellas.

---

## Endpoints

Base URL: `http://localhost:2305`

| Metodo | Ruta | Acceso |
|---|---|---|
| POST | `/api/usuario/registrar` | Publico |
| POST | `/api/usuario/login` | Publico |
| GET | `/api/usuario/perfil` | Token |
| POST | `/api/organizacion` | Administrador |
| GET | `/api/organizacion` | Token |
| POST | `/api/organizacion/unirse` | Token |
| GET | `/api/organizacion/:id/miembros` | Token + miembro |
| PATCH | `/api/organizacion/:id` | Creador de la organizacion |
| POST | `/api/casilla` | Administrador (creador de la organizacion) |
| GET | `/api/casilla/organizacion/:organizacionId` | Token + miembro |
| PATCH | `/api/casilla/:id/estado` | Guardia/Admin + miembro |
| PATCH | `/api/casilla/:id` | Creador de la organizacion |
| POST | `/api/reserva` | Token (miembro, o cualquiera si la organizacion es publica) |
| PATCH | `/api/reserva/:id/finalizar` | Dueño de la reserva, o guardia/admin **miembro de esa organización** |
| GET | `/api/reserva/propias` | Token |
| GET | `/api/reserva/organizacion/:organizacionId/alertas` | Guardia/Admin + miembro |

Para las rutas con token, enviar el header:
```
Authorization: Bearer <token>
```

### Cuerpos de ejemplo

`POST /api/usuario/registrar`
```json
{
  "nombre": "Victor",
  "apellido": "Cordoba",
  "documento": "1000123456",
  "telefono": "3001234567",
  "correo": "victor@correo.com",
  "password": "123456",
  "rol": "administrador"
}
```
`rol` y `placas` son opcionales. Si no se envia `rol`, queda como `usuario`.

`POST /api/usuario/login`
```json
{ "correo": "victor@correo.com", "password": "123456" }
```

`POST /api/organizacion`
```json
{
  "nombre": "Aguas del Bosque",
  "nit": "900123456-7",
  "tipoEntidad": "Residencial",
  "direccion": "Calle 74 Sur",
  "totalPuestos": 10,
  "limiteMiembros": 20,
  "zonaHoraria": "America/Bogota",
  "reservasPublicas": true
}
```
`tipoEntidad` debe ser `Residencial`, `Comercial`, `Mixto` o `Publico`.

`POST /api/organizacion/unirse`
```json
{ "codigoInvitacion": "AB12CD" }
```

`POST /api/casilla`
```json
{ "organizacion": "<id>", "codigo": "A1", "seccion": "Seccion A", "tipo": "standard" }
```

`PATCH /api/casilla/:id/estado`
```json
{ "estado": "ocupado" }
```

`POST /api/reserva`
```json
{ "casilla": "<id>", "placa": "ABC123", "duracionHoras": 2 }
```

`GET /api/reserva/organizacion/:organizacionId/alertas` no recibe nada y devuelve las reservas
vencidas con las horas ya convertidas al `zonaHoraria` de la organización:

```json
{
  "message": "alertas encontradas",
  "zonaHoraria": "America/Bogota",
  "alertas": [
    {
      "reserva": "<id>",
      "placa": "ABC123",
      "casilla": "<id>",
      "horaInicio": "2026-06-14 15:04",
      "horaFin": "2026-06-14 17:04",
      "horasVencidas": 4,
      "zonaHoraria": "America/Bogota"
    }
  ]
}
```

---

## Guia paso a paso para probar en Postman

Con el servidor corriendo (`npm start`, puerto `2305`), sigue este orden.

**1. Registrar un administrador, un guardia y un usuario**
`POST /api/usuario/registrar` tres veces, cambiando `correo`, `documento` y `rol` cada vez (el tercero sin `rol`, queda `usuario`).

**2. Login de cada uno**
`POST /api/usuario/login` con `correo`/`password`. Guarda los 3 tokens.

**3. Ver el perfil**
`GET /api/usuario/perfil` con cualquiera de los tokens.

**4. El admin crea una organizacion**
`POST /api/organizacion` con `tokenAdmin`. Guarda el `_id` y el `codigoInvitacion`.

**5. El guardia y el usuario se unen con el codigo**
`POST /api/organizacion/unirse` con `tokenGuardia` y luego con `tokenUsuario`.

**6. Listar miembros**
`GET /api/organizacion/:id/miembros` con cualquier token de un miembro.

**7. El admin crea las casillas**
`POST /api/casilla` varias veces (`A1`, `A2`, `B1`...), hasta como maximo `totalPuestos`.

**8. Intentar crear una casilla con el guardia (debe fallar)**
Mismo endpoint, con `tokenGuardia`. Esperado: `403`.

**9. Listar las casillas**
`GET /api/casilla/organizacion/:organizacionId`.

**10. El guardia marca una casilla como ocupada**
`PATCH /api/casilla/:id/estado` con `tokenGuardia`.

**11. El usuario intenta lo mismo (debe fallar)**
Mismo endpoint, con `tokenUsuario`. Esperado: `403`.

**12. El usuario reserva una casilla libre**
`POST /api/reserva` con `tokenUsuario`, usando el `_id` de otra casilla que siga `libre`.

**13. Ver mis reservas**
`GET /api/reserva/propias` con `tokenUsuario`.

**14. Ver alertas (todavia sin reservas vencidas)**
`GET /api/reserva/organizacion/:organizacionId/alertas` con `tokenGuardia`. Esperado: lista vacia.

**15. Simular una reserva vencida**
En Mongo (Compass o `mongosh`), edita manualmente el campo `horaInicio` de esa reserva a una fecha de hace 3 horas. Repite el paso 14: ahora deberia aparecer.

**16. Finalizar la reserva**
`PATCH /api/reserva/:id/finalizar` con `tokenUsuario`. La casilla vuelve a `libre`.

**17. El admin edita la organizacion**
`PATCH /api/organizacion/:id` con `tokenAdmin`, por ejemplo cambiando `limiteMiembros`.

**18. Probar sin token**
Cualquier ruta protegida sin el header `Authorization`. Esperado: `401`.

Este es el recorrido minimo para ver el sistema funcionando. Para probar los casos limite
(organizaciones publicas, validaciones que deben fallar, permisos cruzados) y para
reproducir los bugs de la seccion de limitaciones, usa la guia completa.

---

## Limitaciones conocidas

Lo que **no** hace el sistema todavía. 

**Bugs**

- **No hay control de concurrencia.** Dos reservas que llegan al mismo tiempo sobre la misma
  casilla pueden las dos entrar y dejar varias reservas `activas` sobre la misma casilla.
- **`PATCH /api/casilla/:id` no revisa duplicados.** Al crear si se comprueba que no exista otra
  casilla con el mismo `organizacion` + `seccion` + `codigo`; al editar no, y quedan dos casillas
  con el mismo codigo.
- **El login revela que correos estan registrados.** Un correo inexistente devuelve `404` y uno
  existente con contrasena incorrecta devuelve `401`.
- **La clave del JWT esta escrita en el codigo** (`helpers/auth.js`). Cualquiera que lea el
  repositorio puede fabricar un token de `administrador`. Aceptable en un proyecto academico,
  pero habria que cambiarlo antes de usarlo de verdad.

**Decisiones pendiente**

- El registro publico acepta el campo `rol`. Mientras se esta probando cualquiera puede autoregistrarse como `administrador` o `guardia`; antes de usarlo con datos reales habria que restringir esto.
- `placa` es texto libre, no esta validado contra las `placas` guardadas en el usuario.
- Las alertas solo informan, no liberan la casilla automaticamente — eso se hace con `PATCH /api/reserva/:id/finalizar`. Las horas se calculan en el `zonaHoraria` de la organizacion, no en la del servidor.
- `cobroAutomatico`, `cobroPorHora` y `acceso24_7` se guardan pero ninguna parte del codigo los usa: son banderas para mas adelante.

---

## Modelo de datos

- **usuarios**: nombre, apellido, documento, telefono, correo, password (hash), placas[], rol
- **organizaciones**: nombre, nit, tipoEntidad, direccion, descripcion, totalPuestos, limiteMiembros, zonaHoraria, reservasPublicas, cobroAutomatico, cobroPorHora, acceso24_7, codigoInvitacion, creadoPor
- **membresias**: usuario, organizacion
- **casillas**: organizacion, codigo, seccion, tipo, estado (`libre` / `ocupado`)
- **reservas**: casilla, organizacion, usuario, placa, horaInicio, duracionHoras, estado (`activa` / `finalizada`)

---

**Desarrollado por:** Víctor Manuel Cordoba Larez y Ricardo Jaraba Gallego

**Carrera:** Ingeniería Informática

**Materia:** Desarrollo Web

**Institución:** Corporación Universitaria Lasallista
