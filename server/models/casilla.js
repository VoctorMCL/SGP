'use strict';

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CasillaSchema = Schema(
    {
        "organizacion": { type: Schema.Types.ObjectId, ref: "organizaciones" },
        "codigo": String,
        "seccion": String,
        "tipo": String,
        "estado": String,
        "posX": { type: Number, default: 0 },
        "posY": { type: Number, default: 0 },
        "rotacion": { type: Number, default: 0 }
    }
);

module.exports = mongoose.model("casillas", CasillaSchema);
