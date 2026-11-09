'use strict';

const METODOS_CON_CUERPO = ['POST', 'PUT', 'PATCH'];

/**
 * Normaliza y valida el cuerpo de las peticiones que pueden enviarlo.
 * Evita que un body ausente o con un Content-Type incorrecto llegue a los
 * controladores y termine generando un error 500.
 */
function validarCuerpoJson(req, resp, next) {
    if (!METODOS_CON_CUERPO.includes(req.method)) {
        return next();
    }

    const tieneCuerpo = Number(req.headers['content-length'] || 0) > 0
        || Boolean(req.headers['transfer-encoding']);

    if (!tieneCuerpo) {
        if (req.body === undefined || req.body === null) {
            req.body = {};
        }
        return next();
    }

    if (!req.is('application/json')) {
        return resp.status(415).send({
            "message": "El Content-Type debe ser application/json"
        });
    }

    if (req.body === undefined || req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return resp.status(400).send({
            "message": "El cuerpo de la solicitud debe ser un objeto JSON"
        });
    }

    next();
}

module.exports = { validarCuerpoJson };
