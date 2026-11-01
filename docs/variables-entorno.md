# Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables.

## Variables Requeridas

| Variable | Tipo | Requerida | Descripción | Ejemplo |
|---|---|---|---|---|
| `MONGO_URI` | String | Sí | Cadena de conexión a MongoDB. Puede ser local o MongoDB Atlas. | `mongodb://localhost:27017/parqueo` o `mongodb+srv://user:pass@cluster.mongodb.net/parqueo` |
| `PORT` | Number | No | Puerto donde levantará el servidor. Por defecto `2305`. | `2305` |
| `JWT_SECRET` | String | Recomendado | Secreto para firmar tokens JWT. **Actualmente el código usa `"abc"` hardcodeado en `helpers/auth.js`**, pero es buena práctica definirlo aquí. | `mi_secreto_super_seguro` |

## Ejemplo `.env`

```env
MONGO_URI=mongodb://localhost:27017/parqueo
PORT=2305
JWT_SECRET=sgp_dev_secret
```

## Notas

- El archivo `.env` **NO debe subirse al repositorio**. Ya está en `.gitignore`.
- Para datos de prueba puedes usar `npm run seed` después de configurar la conexión.
- En entornos serverless (como Vercel) se usan `MONGO_URI` o `MONGODB_URI`. El proyecto ya contempla ambos. 
