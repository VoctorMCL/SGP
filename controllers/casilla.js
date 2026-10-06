'use strict';

let Casillas = require("../models/casilla");
let Organizaciones = require("../models/organizacion");
let Reservas = require("../models/reserva");
let membresiaHelper = require("../helpers/membresia");
let validacion = require("../helpers/validacion");

let tiposValidos = ['standard', 'discapacitados', 'electrico'];
let estadosValidos = ['libre', 'ocupado'];

function crearCasilla(req, resp) {
    let requestBody = req.body;

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

                    Casillas.countDocuments({ "organizacion": organizacion._id }).then(
                        (casillasExistentes) => {
                            if (casillasExistentes >= organizacion.totalPuestos) {
                                return resp.status(400).send({ "message": "La organizacion ya tiene sus " + organizacion.totalPuestos + " puestos definidos" });
                            }

                            let casilla = new Casillas({
                                "organizacion": organizacion._id,
                                "codigo": requestBody.codigo,
                                "seccion": requestBody.seccion,
                                "tipo": tipo,
                                "estado": "libre"
                            });

                            casilla.save().then(
                                (casillaCreada) => {
                                    resp.status(201).send({ "message": "casilla creada", "casilla": casillaCreada });
                                },
                                err => {
                                    resp.status(500).send({ "message": "Error al crear la casilla", "error": err });
                                }
                            );
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al contar las casillas", "error": err });
                        }
                    );
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la organizacion", "error": err });
        }
    );
}

function listarCasillas(req, resp) {
    let organizacionId = req.params.organizacionId;

    if (!validacion.idValido(organizacionId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    membresiaHelper.esMiembro(req.usuario.id, organizacionId).then(
        (esMiembro) => {
            if (!esMiembro) {
                return resp.status(403).send({ "message": "No pertenece a esta organizacion" });
            }

            Casillas.find({ "organizacion": organizacionId }).then(
                (casillas) => {
                    resp.status(200).send({ "message": "casillas encontradas", "casillas": casillas });
                },
                err => {
                    resp.status(500).send({ "message": "Error al consultar las casillas", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al validar la pertenencia", "error": err });
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
                                resp.status(500).send({ "message": "Error al validar reservas activas", "error": err });
                            }
                        );
                    }
                    else {
                        guardarEstadoCasilla(casilla, estado, resp);
                    }
                },
                err => {
                    resp.status(500).send({ "message": "Error al validar la pertenencia", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la casilla", "error": err });
        }
    );
}

function guardarEstadoCasilla(casilla, estado, resp) {
    casilla.estado = estado;
    casilla.save().then(
        (casillaActualizada) => {
            resp.status(200).send({ "message": "estado actualizado", "casilla": casillaActualizada });
        },
        err => {
            resp.status(500).send({ "message": "Error al actualizar la casilla", "error": err });
        }
    );
}

function editarCasilla(req, resp) {
    let casillaId = req.params.id;
    let requestBody = req.body;

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
                                resp.status(500).send({ "message": "Error al validar reservas activas", "error": err });
                            }
                        );
                    }
                    else {
                        guardarEdicionCasilla(casilla, requestBody, resp);
                    }
                },
                err => {
                    resp.status(500).send({ "message": "Error al buscar la organizacion", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la casilla", "error": err });
        }
    );
}

function guardarEdicionCasilla(casilla, requestBody, resp) {
    if (requestBody.codigo) casilla.codigo = requestBody.codigo;
    if (requestBody.seccion) casilla.seccion = requestBody.seccion;
    if (requestBody.tipo) casilla.tipo = requestBody.tipo;
    if (requestBody.estado) casilla.estado = requestBody.estado;

    casilla.save().then(
        (casillaActualizada) => {
            resp.status(200).send({ "message": "casilla actualizada", "casilla": casillaActualizada });
        },
        err => {
            resp.status(500).send({ "message": "Error al actualizar la casilla", "error": err });
        }
    );
}

module.exports = { crearCasilla, listarCasillas, cambiarEstado, editarCasilla };
