'use strict';

let jwt = require('jwt-simple');
let moment = require('moment');
let mongoose = require('mongoose');

let secret = process.env.JWT_SECRET || "abc";
let rolesValidos = ['administrador', 'guardia', 'usuario'];

function crearToken(usuario) {
    let payload = {
        sub: usuario._id,
        correo: usuario.correo,
        rol: usuario.rol,
        iat: moment().unix(),
        exp: moment().add(60, 'minutes').unix()
    }
    return jwt.encode(payload, secret);
}

function validarToken(req, resp, next) {
    let autorizacion = req.headers.authorization || '';

    if (!autorizacion.startsWith('Bearer ')) {
        return resp.status(401).send({ "message": "No autorizado, debe iniciar sesion" });
    }

    let token = autorizacion.slice('Bearer '.length).trim();
    if (!token) {
        return resp.status(401).send({ "message": "No autorizado, debe iniciar sesion" });
    }

    try {
        let payload = jwt.decode(token, secret);
        if (!payload.sub || !mongoose.isValidObjectId(payload.sub) || !rolesValidos.includes(payload.rol)) {
            return resp.status(401).send({ "message": "Token invalido" });
        }
        req.usuario = { "id": payload.sub, "rol": payload.rol };
        next();
    }
    catch (ex) {
        resp.status(401).send({ "message": "No autorizado, token invalido o vencido" });
    }
}

function validarAdministrador(req, resp, next) {
    if (!req.usuario || req.usuario.rol !== 'administrador') {
        return resp.status(403).send({ "message": "No autorizado, se requiere rol administrador" });
    }
    next();
}

function validarGuardiaOAdmin(req, resp, next) {
    if (!req.usuario || (req.usuario.rol !== 'guardia' && req.usuario.rol !== 'administrador')) {
        return resp.status(403).send({ "message": "No autorizado, se requiere rol guardia o administrador" });
    }
    next();
}

function esStaff(rol) {
    return rol === 'guardia' || rol === 'administrador';
}

module.exports = { crearToken, validarToken, validarAdministrador, validarGuardiaOAdmin, esStaff };
