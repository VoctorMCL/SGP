'use strict';

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CasillaSchema = Schema(
    {
        "organizacion": { type: Schema.Types.ObjectId, ref: "organizaciones" },
        "codigo": String,
        "seccion": String,
        "tipo": String,
        "estado": String
    }
);

module.exports = mongoose.model("casillas", CasillaSchema);
