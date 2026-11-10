'use strict';

let Casillas = require("../models/casilla");
let Organizaciones = require("../models/organizacion");
let Reservas = require("../models/reserva");
let membresiaHelper = require("../helpers/membresia");
let validacion = require("../helpers/validacion");
let socketHelper = require("../helpers/socket");
let { errorInterno } = require("../helpers/respuestas");

let tiposValidos = ['standard', 'discapacitados', 'electrico', 'entrada', 'salida', 'carril'];
let tiposPuesto = ['standard', 'discapacitados', 'electrico'];
let estadosValidos = ['libre', 'ocupado'];

function esPuesto(tipo) {
    return tiposPuesto.includes(tipo);
}

/**
 * Deja `totalPuestos` igual al numero real de puestos del plano.
 * Las entradas, salidas y carriles no cuentan como puestos.
 */
function sincronizarTotalPuestos(organizacionId) {
    return Casillas.countDocuments({
        "organizacion": organizacionId,
        "tipo": { $in: tiposPuesto }
    }).then((total) => {
        return Organizaciones.findByIdAndUpdate(organizacionId, { $set: { "totalPuestos": total } });
    });
}

function crearCasilla(req, resp) {
    let requestBody = req.body || {};

    if (!requestBody.organizacion || !requestBody.codigo || !requestBody.seccion) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios de la casilla" });
    }

    if (!validacion.idValido(requestBody.organizacion)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    if (!validacion.texto(requestBody.codigo) || !validacion.texto(requestBody.seccion)) {
        return resp.status(400).send({ "message": "codigo y seccion deben ser texto" });
    }

    let tipo = requestBody.tipo || 'standard';
    if (!tiposValidos.includes(tipo)) {
        return resp.status(400).send({ "message": "El tipo debe ser standard, discapacitados o electrico" });
    }

    if ((requestBody.posX !== undefined && !validacion.numero(requestBody.posX))
        || (requestBody.posY !== undefined && !validacion.numero(requestBody.posY))
        || (requestBody.rotacion !== undefined && !validacion.numero(requestBody.rotacion))) {
        return resp.status(400).send({ "message": "posX, posY y rotacion deben ser numeros" });
    }

    Organizaciones.findById(requestBody.organizacion).then(
        (organizacion) => {
            if (!organizacion) {
                return resp.status(404).send({ "message": "Organizacion no encontrada" });
            }
            if (organizacion.creadoPor.toString() !== req.usuario.id) {
                return resp.status(403).send({ "message": "Solo el creador de la organizacion puede definir el mapa de casillas" });
            }

            Casillas.findOne({ "organizacion": organizacion._id, "seccion": requestBody.seccion, "codigo": requestBody.codigo }).then(
                (casillaExistente) => {
                    if (casillaExistente) {
                        return resp.status(400).send({ "message": "Ya existe una casilla con ese codigo en esa seccion" });
                    }

                    let casilla = new Casillas({
                        "organizacion": organizacion._id,
                        "codigo": requestBody.codigo,
                        "seccion": requestBody.seccion,
                        "tipo": tipo,
                        "estado": "libre",
                        "posX": typeof requestBody.posX === 'number' ? requestBody.posX : 0,
                        "posY": typeof requestBody.posY === 'number' ? requestBody.posY : 0,
                        "rotacion": typeof requestBody.rotacion === 'number' ? requestBody.rotacion : 0
                    });

                    casilla.save().then(
                        (casillaCreada) => {
                            socketHelper.emitirEvento('casilla:creada', casillaCreada, casillaCreada.organizacion);
                            resp.status(201).send({ "message": "casilla creada", "casilla": casillaCreada });
                        },
                        err => {
                            errorInterno(resp, "Error al crear la casilla", err);
                        }
                    );
                }
            );
        },
        err => {
            errorInterno(resp, "Error al buscar la organizacion", err);
        }
    );
}

function listarCasillas(req, resp) {
    let organizacionId = req.params.organizacionId;

    if (!validacion.idValido(organizacionId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    // La vista del conductor es de solo lectura: cualquier usuario autenticado
    // puede consultar el plano. Reservar sigue validando membresía o que la
    // sede permita reservas públicas.
    Casillas.find({ "organizacion": organizacionId }).then(
        (casillas) => {
            resp.status(200).send({ "message": "casillas encontradas", "casillas": casillas });
        },
        err => {
            errorInterno(resp, "Error al consultar las casillas", err);
        }
    );
}

/**
 * Lista las casillas de todas las sedes para el buscador global.
 * Solo devuelve los campos necesarios para mostrar un resultado.
 */
function listarTodasCasillas(req, resp) {
    Casillas.find({})
        .select('_id organizacion codigo seccion tipo estado')
        .then(
            (casillas) => {
                resp.status(200).send({ "message": "casillas encontradas", "casillas": casillas });
            },
            err => {
                errorInterno(resp, "Error al consultar las casillas", err);
            }
        );
}

function cambiarEstado(req, resp) {
    let casillaId = req.params.id;
    let estado = req.body.estado;

    if (!validacion.idValido(casillaId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    if (!estadosValidos.includes(estado)) {
        return resp.status(400).send({ "message": "El estado debe ser libre u ocupado" });
    }

    Casillas.findById(casillaId).then(
        (casilla) => {
            if (!casilla) {
                return resp.status(404).send({ "message": "Casilla no encontrada" });
            }

            membresiaHelper.esMiembro(req.usuario.id, casilla.organizacion).then(
                (esMiembro) => {
                    if (!esMiembro) {
                        return resp.status(403).send({ "message": "No pertenece a esta organizacion" });
                    }

                    if (estado === 'libre' && casilla.estado === 'ocupado') {
                        Reservas.findOne({ "casilla": casilla._id, "estado": "activa" }).then(
                            (reservaActiva) => {
                                if (reservaActiva) {
                                    return resp.status(400).send({ "message": "La casilla tiene una reserva activa, primero finalice la reserva" });
                                }
                                guardarEstadoCasilla(casilla, estado, resp);
                            },
                            err => {
                                errorInterno(resp, "Error al validar reservas activas", err);
                            }
                        );
                    }
                    else {
                        guardarEstadoCasilla(casilla, estado, resp);
                    }
                },
                err => {
                    errorInterno(resp, "Error al validar la pertenencia", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al buscar la casilla", err);
        }
    );
}

function guardarEstadoCasilla(casilla, estado, resp) {
    casilla.estado = estado;
    casilla.save().then(
        (casillaActualizada) => {
            socketHelper.emitirEvento('casilla:actualizada', casillaActualizada, casillaActualizada.organizacion);
            resp.status(200).send({ "message": "estado actualizado", "casilla": casillaActualizada });
        },
        err => {
            errorInterno(resp, "Error al actualizar la casilla", err);
        }
    );
}

function editarCasilla(req, resp) {
    let casillaId = req.params.id;
    let requestBody = req.body || {};

    if (!validacion.idValido(casillaId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    if (requestBody.tipo && !tiposValidos.includes(requestBody.tipo)) {
        return resp.status(400).send({ "message": "El tipo debe ser standard, discapacitados o electrico" });
    }
    if (requestBody.estado && !estadosValidos.includes(requestBody.estado)) {
        return resp.status(400).send({ "message": "El estado debe ser libre u ocupado" });
    }
    if (requestBody.codigo !== undefined && !validacion.texto(requestBody.codigo)) {
        return resp.status(400).send({ "message": "codigo debe ser texto" });
    }
    if (requestBody.seccion !== undefined && !validacion.texto(requestBody.seccion)) {
        return resp.status(400).send({ "message": "seccion debe ser texto" });
    }
    if ((requestBody.posX !== undefined && !validacion.numero(requestBody.posX))
        || (requestBody.posY !== undefined && !validacion.numero(requestBody.posY))
        || (requestBody.rotacion !== undefined && !validacion.numero(requestBody.rotacion))) {
        return resp.status(400).send({ "message": "posX, posY y rotacion deben ser numeros" });
    }

    Casillas.findById(casillaId).then(
        (casilla) => {
            if (!casilla) {
                return resp.status(404).send({ "message": "Casilla no encontrada" });
            }

            Organizaciones.findById(casilla.organizacion).then(
                (organizacion) => {
                    if (!organizacion) {
                        return resp.status(404).send({ "message": "Organizacion no encontrada" });
                    }
                    if (organizacion.creadoPor.toString() !== req.usuario.id) {
                        return resp.status(403).send({ "message": "Solo el creador de la organizacion puede modificar sus casillas" });
                    }

                    if (requestBody.estado === 'libre' && casilla.estado === 'ocupado') {
                        Reservas.findOne({ "casilla": casilla._id, "estado": "activa" }).then(
                            (reservaActiva) => {
                                if (reservaActiva) {
                                    return resp.status(400).send({ "message": "La casilla tiene una reserva activa, primero finalice la reserva" });
                                }
                                guardarEdicionCasilla(casilla, requestBody, resp);
                            },
                            err => {
                                errorInterno(resp, "Error al validar reservas activas", err);
                            }
                        );
                    }
                    else {
                        guardarEdicionCasilla(casilla, requestBody, resp);
                    }
                },
                err => {
                    errorInterno(resp, "Error al buscar la organizacion", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al buscar la casilla", err);
        }
    );
}

function guardarEdicionCasilla(casilla, requestBody, resp) {
    let actualizacion = {};

    if (requestBody.codigo && typeof requestBody.codigo === 'string') {
        actualizacion.codigo = requestBody.codigo.trim();
    }
    if (requestBody.seccion && typeof requestBody.seccion === 'string') {
        actualizacion.seccion = requestBody.seccion.trim();
    }
    if (requestBody.tipo && tiposValidos.includes(requestBody.tipo)) {
        actualizacion.tipo = requestBody.tipo;
    }
    if (requestBody.estado && estadosValidos.includes(requestBody.estado)) {
        actualizacion.estado = requestBody.estado;
    }
    if (typeof requestBody.posX === 'number' && !isNaN(requestBody.posX)) {
        actualizacion.posX = Math.round(requestBody.posX);
    }
    if (typeof requestBody.posY === 'number' && !isNaN(requestBody.posY)) {
        actualizacion.posY = Math.round(requestBody.posY);
    }
    if (typeof requestBody.rotacion === 'number' && !isNaN(requestBody.rotacion)) {
        actualizacion.rotacion = ((Math.round(requestBody.rotacion) % 360) + 360) % 360;
    }

    if (Object.keys(actualizacion).length === 0) {
        return resp.status(400).send({ "message": "No hay campos válidos para actualizar" });
    }

    let nuevoCodigo = actualizacion.codigo || casilla.codigo;
    let nuevaSeccion = actualizacion.seccion || casilla.seccion;

    Casillas.findOne({
        "organizacion": casilla.organizacion,
        "seccion": nuevaSeccion,
        "codigo": nuevoCodigo,
        "_id": { $ne: casilla._id }
    }).then(
        (duplicada) => {
            if (duplicada) {
                return resp.status(400).send({ "message": "Ya existe una casilla con ese codigo en esa seccion" });
            }
            aplicarEdicionCasilla(casilla, actualizacion, resp);
        },
        err => {
            errorInterno(resp, "Error al validar el codigo de la casilla", err);
        }
    );
}

function aplicarEdicionCasilla(casilla, actualizacion, resp) {
    Casillas.findByIdAndUpdate(casilla._id, { $set: actualizacion }, { new: true }).then(
        (casillaActualizada) => {
            if (!casillaActualizada) {
                return resp.status(404).send({ "message": "Casilla no encontrada al actualizar" });
            }
            console.log('[CASILLA] Actualizada:', casillaActualizada._id, actualizacion);

            let responder = () => {
                socketHelper.emitirEvento('casilla:actualizada', casillaActualizada, casillaActualizada.organizacion);
                resp.status(200).send({ "message": "casilla actualizada", "casilla": casillaActualizada });
            };

            // Solo cambia el total si el elemento deja de ser (o pasa a ser) un puesto.
            if (actualizacion.tipo && esPuesto(casilla.tipo) !== esPuesto(actualizacion.tipo)) {
                sincronizarTotalPuestos(casilla.organizacion).then(
                    responder,
                    err => {
                        console.error('[CASILLA] No se pudo sincronizar totalPuestos:', err);
                        responder();
                    }
                );
            }
            else {
                responder();
            }
        },
        err => {
            console.error('[CASILLA] Error al actualizar:', err);
            errorInterno(resp, "Error al actualizar la casilla", err);
        }
    );
}

function eliminarCasilla(req, resp) {
    let casillaId = req.params.id;

    if (!validacion.idValido(casillaId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    Casillas.findById(casillaId).then(
        (casilla) => {
            if (!casilla) {
                return resp.status(404).send({ "message": "Casilla no encontrada" });
            }

            Organizaciones.findById(casilla.organizacion).then(
                (organizacion) => {
                    if (!organizacion) {
                        return resp.status(404).send({ "message": "Organizacion no encontrada" });
                    }
                    if (organizacion.creadoPor.toString() !== req.usuario.id) {
                        return resp.status(403).send({ "message": "Solo el creador puede eliminar elementos" });
                    }

                    Reservas.findOne({ "casilla": casilla._id, "estado": "activa" }).then(
                        (reservaActiva) => {
                            if (reservaActiva) {
                                return resp.status(400).send({ "message": "No se puede eliminar una casilla con reserva activa" });
                            }

                            Casillas.findByIdAndDelete(casillaId).then(
                                () => {
                                    let responder = () => {
                                        socketHelper.emitirEvento('casilla:eliminada', { _id: casillaId }, casilla.organizacion);
                                        resp.status(200).send({ "message": "casilla eliminada", "id": casillaId });
                                    };

                                    // Si el elemento era un puesto, el total de la sede cambia.
                                    if (esPuesto(casilla.tipo)) {
                                        sincronizarTotalPuestos(casilla.organizacion).then(
                                            responder,
                                            err => {
                                                console.error('[CASILLA] No se pudo sincronizar totalPuestos:', err);
                                                responder();
                                            }
                                        );
                                    }
                                    else {
                                        responder();
                                    }
                                },
                                err => errorInterno(resp, "Error al eliminar la casilla", err)
                            );
                        },
                        err => errorInterno(resp, "Error al validar reservas", err)
                    );
                },
                err => errorInterno(resp, "Error al validar organizacion", err)
            );
        },
        err => errorInterno(resp, "Error al buscar casilla", err)
    );
}

module.exports = { crearCasilla, listarCasillas, listarTodasCasillas, cambiarEstado, editarCasilla, eliminarCasilla };
