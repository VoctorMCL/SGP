'use strict';

/**
 * Responde un error interno sin exponer detalles tecnicos al cliente.
 * El detalle real queda en el log del servidor.
 */
function errorInterno(resp, message, err) {
    console.error(`[API] ${message}:`, err && (err.message || err));
    return resp.status(500).send({ message });
}

module.exports = { errorInterno };
