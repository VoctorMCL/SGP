'use strict';

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let MembresiaSchema = Schema(
    {
        "usuario": { type: Schema.Types.ObjectId, ref: "usuarios" },
        "organizacion": { type: Schema.Types.ObjectId, ref: "organizaciones" }
    }
);

module.exports = mongoose.model("membresias", MembresiaSchema);
