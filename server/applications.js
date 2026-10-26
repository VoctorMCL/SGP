'use strict';

let path = require('path');
let express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let routerUsuario = require("./routes/usuario");
let routerOrganizacion = require("./routes/organizacion");
let routerCasilla = require("./routes/casilla");
let routerReserva = require("./routes/reserva");

let application = express();
application.use(bodyParser.json());
application.use(cors());

// Rutas de la API REST
application.use(routerUsuario);
application.use(routerOrganizacion);
application.use(routerCasilla);
application.use(routerReserva);

// Servir la aplicación Angular compilada (archivos estáticos)
let distPath = path.join(__dirname, '../dist/frontend/browser');
application.use(express.static(distPath));

// Redirección SPA para que Angular maneje las rutas del cliente
application.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/socket.io')) {
        return res.sendFile(path.join(distPath, 'index.html'), (err) => {
            if (err) {
                res.status(200).send("API SGP corriendo. Para visualizar la interfaz web, compila con 'npm run build'.");
            }
        });
    }
    next();
});

module.exports = application;
