'use strict';

let mongoose = require("mongoose");

function idValido(id) {
    return mongoose.isValidObjectId(id);
}

function numeroEnteroPositivo(valor) {
    return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}

function booleano(valor) {
    return typeof valor === 'boolean';
}

function numero(valor) {
    return typeof valor === 'number' && Number.isFinite(valor);
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

module.exports = { idValido, numeroEnteroPositivo, booleano, numero, texto, zonaHorariaValida };