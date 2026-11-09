'use strict';

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ReservaSchema = Schema(
    {
        "casilla": { type: Schema.Types.ObjectId, ref: "casillas" },
        "organizacion": { type: Schema.Types.ObjectId, ref: "organizaciones" },
        "usuario": { type: Schema.Types.ObjectId, ref: "usuarios" },
        "placa": String,
        "horaInicio": Date,
        "duracionHoras": Number,
        "estado": String
    }
);

module.exports = mongoose.model("reservas", ReservaSchema);
