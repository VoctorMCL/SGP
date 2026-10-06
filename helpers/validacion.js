'use strict';

let mongoose = require("mongoose");

// mongoose.isValidObjectId() deja validar un id antes de mandarlo a la base de datos.
// Sin esto, un id como "abc" hace que la consulta reviente con un CastError y, si el
// error no se maneja, el proceso de Node se detiene.
function idValido(id) {
    return mongoose.isValidObjectId(id);
}

function numeroEnteroPositivo(valor) {
    return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}

function booleano(valor) {
    return typeof valor === 'boolean';
}

function texto(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

function zonaHorariaValida(zona) {
    if (typeof zona !== 'string' || zona.trim() === '') {
        return false;
    }
    try {
        new Intl.DateTimeFormat("es", { timeZone: zona });
        return true;
    }
    catch (err) {
        return false;
    }
}

module.exports = { idValido, numeroEnteroPositivo, booleano, texto, zonaHorariaValida };