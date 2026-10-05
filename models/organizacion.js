'use strict';

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let OrganizacionSchema = Schema(
    {
        "nombre": String,
        "nit": String,
        "tipoEntidad": String,
        "direccion": String,
        "descripcion": String,
        "totalPuestos": Number,
        "limiteMiembros": Number,
        "zonaHoraria": String,
        "reservasPublicas": Boolean,
        "cobroAutomatico": Boolean,
        "cobroPorHora": Boolean,
        "acceso24_7": Boolean,
        "codigoInvitacion": String,
        "creadoPor": { type: Schema.Types.ObjectId, ref: "usuarios" }
    }
);

module.exports = mongoose.model("organizaciones", OrganizacionSchema);
