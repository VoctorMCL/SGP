'use strict';

let Membresias = require("../models/membresia");

function esMiembro(usuarioId, organizacionId) {
    return Membresias.findOne({ "usuario": usuarioId, "organizacion": organizacionId }).then(
        (membresia) => {
            return membresia ? true : false;
        }
    );
}

module.exports = { esMiembro };
