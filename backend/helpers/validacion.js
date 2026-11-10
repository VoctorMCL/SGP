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

function normalizarNombre(valor) {
    if (typeof valor !== 'string') {
        return valor;
    }
    return valor
        .trim()
        .toLocaleLowerCase('es')
        .replace(/(^|[\s'-])(\p{L})/gu, (coincidencia, separador, letra) => separador + letra.toLocaleUpperCase('es'));
}

function normalizarPlaca(valor) {
    if (typeof valor !== 'string') {
        return valor;
    }
    let limpia = valor.trim().toUpperCase();
    let coincidencia = limpia.match(/^([A-Z]{3})[\s_-]?([0-9]{3})$/);
    return coincidencia ? `${coincidencia[1]}-${coincidencia[2]}` : limpia;
}

function placaValida(valor) {
    return typeof valor === 'string' && /^([A-Z]{3})[\s_-]?([0-9]{3})$/.test(valor.trim().toUpperCase());
}

function latitudValida(valor) {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= -90 && valor <= 90;
}

function longitudValida(valor) {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= -180 && valor <= 180;
}

function nitValido(valor) {
    // NIT colombiano: solo digitos, con puntos y guiones opcionales.
    // Ejemplos validos: 890.984.812-5, 900123456-7, 900123456.
    return typeof valor === 'string' && /^[0-9]+(?:[.\-][0-9]+)*$/.test(valor.trim());
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

module.exports = { idValido, numeroEnteroPositivo, booleano, numero, texto, normalizarNombre, normalizarPlaca, placaValida, nitValido, latitudValida, longitudValida, zonaHorariaValida };