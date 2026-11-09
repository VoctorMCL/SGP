'use strict';

let express = require("express");
let router = express.Router();
let organizacionController = require('../controllers/organizacion');
let auth = require("../helpers/auth");

router.post("/api/organizacion", auth.validarToken, auth.validarAdministrador, organizacionController.crearOrganizacion);
router.get("/api/organizacion", auth.validarToken, organizacionController.misOrganizaciones);
router.post("/api/organizacion/unirse", auth.validarToken, organizacionController.unirseOrganizacion);
router.get("/api/organizacion/:id/miembros", auth.validarToken, organizacionController.listarMiembros);
router.patch("/api/organizacion/:id", auth.validarToken, organizacionController.editarOrganizacion);

module.exports = router;
