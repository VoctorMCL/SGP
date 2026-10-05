'use strict';

let express = require("express");
let router = express.Router();
let casillaController = require('../controllers/casilla');
let auth = require("../helpers/auth");

router.post("/api/casilla", auth.validarToken, auth.validarAdministrador, casillaController.crearCasilla);
router.get("/api/casilla/organizacion/:organizacionId", auth.validarToken, casillaController.listarCasillas);
router.patch("/api/casilla/:id/estado", auth.validarToken, auth.validarGuardiaOAdmin, casillaController.cambiarEstado);
router.patch("/api/casilla/:id", auth.validarToken, casillaController.editarCasilla);

module.exports = router;
