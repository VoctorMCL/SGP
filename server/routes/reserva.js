'use strict';

let express = require("express");
let router = express.Router();
let reservaController = require('../controllers/reserva');
let auth = require("../helpers/auth");

router.post("/api/reserva", auth.validarToken, reservaController.crearReserva);
router.patch("/api/reserva/:id/finalizar", auth.validarToken, reservaController.finalizarReserva);
router.get("/api/reserva/propias", auth.validarToken, reservaController.misReservas);
router.get("/api/reserva/organizacion/:organizacionId/alertas", auth.validarToken, auth.validarGuardiaOAdmin, reservaController.alertasOrganizacion);

module.exports = router;
