'use strict';

let express = require("express");
let router = express.Router();
let usuarioController = require('../controllers/usuario');
let auth = require("../helpers/auth");

router.post("/api/usuario/registrar", usuarioController.registrarUsuario);
router.post("/api/usuario/login", usuarioController.loguearUsuario);
router.get("/api/usuario/perfil", auth.validarToken, usuarioController.perfilUsuario);

module.exports = router;
