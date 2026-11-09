'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const routerUsuario = require('./routes/usuario');
const routerOrganizacion = require('./routes/organizacion');
const routerCasilla = require('./routes/casilla');
const routerReserva = require('./routes/reserva');
const { validarCuerpoJson } = require('./middlewares/validarCuerpo');
const { manejarErrores } = require('./middlewares/errores');

const app = express();

app.disable('x-powered-by');

// Middlewares globales
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());
app.use(validarCuerpoJson);

// Rutas de la API REST
app.use(routerUsuario);
app.use(routerOrganizacion);
app.use(routerCasilla);
app.use(routerReserva);

// Servir la aplicación Angular compilada (archivos estáticos)
const distPath = path.join(__dirname, '../dist/frontend/browser');
app.use(express.static(distPath));

// Las rutas de API inexistentes deben responder JSON, no HTML
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Ruta de API no encontrada' });
});

// Redirección SPA para que Angular maneje las rutas del cliente
app.use((req, res, next) => {
    // Endpoints internos de Vercel Analytics: fuera de Vercel no existen.
    if (req.url.startsWith('/_vercel/')) {
        return res.status(204).end();
    }

    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/socket.io')) {
        return res.sendFile(path.join(distPath, 'index.html'), (err) => {
            if (err) {
                res.status(200).send("API SGP corriendo. Para visualizar la interfaz web, compila con 'npm run build'.");
            }
        });
    }

    next();
});

// Manejador central: cualquier error debe salir como JSON con su status HTTP
app.use(manejarErrores);

module.exports = app;
