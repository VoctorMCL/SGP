'use strict';

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
application.use(routerUsuario);
application.use(routerOrganizacion);
application.use(routerCasilla);
application.use(routerReserva);

module.exports = application;
