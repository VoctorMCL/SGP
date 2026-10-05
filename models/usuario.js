'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let UsuarioSchema = Schema(
    {
        nombre: String,
        apellido: String,
        documento: String,
        telefono: String,
        correo: String,
        password: String,
        placas: [String],
        rol: String // administrador | guardia | usuario
    }
);

module.exports = mongoose.model('usuarios', UsuarioSchema);
