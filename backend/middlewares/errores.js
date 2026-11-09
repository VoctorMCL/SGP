'use strict';

/**
 * Manejador central de errores de la API.
 * Siempre responde JSON con un código HTTP coherente, incluso cuando el error
 * viene de body-parser, Mongoose o de un fallo inesperado del servidor.
 */
function manejarErrores(err, req, resp, next) {
    if (resp.headersSent) {
        return next(err);
    }

    let status = Number(err.status || err.statusCode) || 500;
    let message = 'Error interno del servidor';
    let detalles;

    if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'El cuerpo de la solicitud no es un JSON valido';
    }
    else if (err.type === 'entity.too.large') {
        status = 413;
        message = 'El cuerpo de la solicitud es demasiado grande';
    }
    else if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
        status = 415;
        message = 'La codificacion o el charset de la solicitud no esta soportado';
    }
    else if (err.name === 'ValidationError') {
        status = 400;
        message = 'Los datos enviados no son validos';
        detalles = Object.keys(err.errors || {}).map((campo) => {
            return { campo, mensaje: err.errors[campo].message };
        });
    }
    else if (err.name === 'CastError') {
        status = 400;
        message = 'Identificador invalido';
    }
    else if (err.code === 11000) {
        status = 409;
        message = 'Ya existe un registro con esos datos';
    }
    else if (status >= 400 && status < 500) {
        message = err.message || message;
    }

    if (status >= 500) {
        console.error('[API] Error no controlado:', err);
    }

    let cuerpo = { message };
    if (detalles) {
        cuerpo.detalles = detalles;
    }

    resp.status(status).send(cuerpo);
}

module.exports = { manejarErrores };
