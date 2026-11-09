'use strict';

let moment = require("moment-timezone");
let Reservas = require("../models/reserva");
let Casillas = require("../models/casilla");
let Organizaciones = require("../models/organizacion");
let membresiaHelper = require("../helpers/membresia");
let auth = require("../helpers/auth");
let validacion = require("../helpers/validacion");
let socketHelper = require("../helpers/socket");
let { errorInterno } = require("../helpers/respuestas");

function crearReserva(req, resp) {
    let requestBody = req.body || {};

    if (!requestBody.casilla || !requestBody.placa
        || requestBody.duracionHoras === undefined || requestBody.duracionHoras === null) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios de la reserva" });
    }
    else if (!validacion.idValido(requestBody.casilla)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }
    else if (!validacion.texto(requestBody.placa)) {
        return resp.status(400).send({ "message": "placa debe ser texto" });
    }
    else if (!validacion.numeroEnteroPositivo(requestBody.duracionHoras)) {
        return resp.status(400).send({ "message": "duracionHoras debe ser un numero entero mayor que cero" });
    }

    let placa = requestBody.placa.trim();

    Casillas.findById(requestBody.casilla).then(
        (casilla) => {
            if (!casilla) {
                return resp.status(404).send({ "message": "Casilla no encontrada" });
            }
            if (casilla.estado !== 'libre') {
                return resp.status(400).send({ "message": "La casilla no esta libre" });
            }

            Organizaciones.findById(casilla.organizacion).then(
                (organizacion) => {
                    if (!organizacion) {
                        return resp.status(404).send({ "message": "Organizacion no encontrada" });
                    }

                    membresiaHelper.esMiembro(req.usuario.id, casilla.organizacion).then(
                        (esMiembro) => {
                            if (!organizacion.reservasPublicas && !esMiembro) {
                                return resp.status(403).send({ "message": "Esta organizacion solo permite reservas a sus miembros" });
                            }

                            let reserva = new Reservas({
                                "casilla": casilla._id,
                                "organizacion": casilla.organizacion,
                                "usuario": req.usuario.id,
                                "placa": placa,
                                "horaInicio": new Date(),
                                "duracionHoras": requestBody.duracionHoras,
                                "estado": "activa"
                            });

                            reserva.save().then(
                                (reservaCreada) => {
                                    casilla.estado = 'ocupado';
                                    casilla.save().then(
                                        () => {
                                            socketHelper.emitirEvento('casilla:actualizada', casilla, casilla.organizacion);
                                            socketHelper.emitirEvento('reserva:creada', reservaCreada, casilla.organizacion);
                                            resp.status(201).send({ "message": "reserva creada", "reserva": reservaCreada });
                                        },
                                        err => {
                                            errorInterno(resp, "Error al actualizar la casilla", err);
                                        }
                                    );
                                },
                                err => {
                                    errorInterno(resp, "Error al crear la reserva", err);
                                }
                            );
                        },
                        err => {
                            errorInterno(resp, "Error al validar la pertenencia", err);
                        }
                    );
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

function finalizarReserva(req, resp) {
    let reservaId = req.params.id;

    if (!validacion.idValido(reservaId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    Reservas.findById(reservaId).then(
        (reserva) => {
            if (!reserva) {
                return resp.status(404).send({ "message": "Reserva no encontrada" });
            }
            if (reserva.estado !== 'activa') {
                return resp.status(400).send({ "message": "La reserva ya esta finalizada" });
            }

            let esElMismoUsuario = reserva.usuario.toString() === req.usuario.id;

            if (esElMismoUsuario) {
                completarFinalizacion(reserva, resp);
                return;
            }

            if (!auth.esStaff(req.usuario.rol)) {
                return resp.status(403).send({ "message": "No puede finalizar esta reserva" });
            }

            membresiaHelper.esMiembro(req.usuario.id, reserva.organizacion).then(
                (esMiembro) => {
                    if (!esMiembro) {
                        return resp.status(403).send({ "message": "No puede finalizar esta reserva" });
                    }
                    completarFinalizacion(reserva, resp);
                },
                err => {
                    errorInterno(resp, "Error al validar la pertenencia", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al buscar la reserva", err);
        }
    );
}

function completarFinalizacion(reserva, resp) {
    Casillas.findById(reserva.casilla).then(
        (casilla) => {
            if (!casilla) {
                return resp.status(404).send({ "message": "Casilla no encontrada" });
            }

            reserva.estado = 'finalizada';
            reserva.save().then(
                () => {
                    casilla.estado = 'libre';
                    casilla.save().then(
                        () => {
                            socketHelper.emitirEvento('casilla:actualizada', casilla, casilla.organizacion);
                            socketHelper.emitirEvento('reserva:finalizada', reserva, casilla.organizacion);
                            resp.status(200).send({ "message": "reserva finalizada", "reserva": reserva });
                        },
                        err => {
                            errorInterno(resp, "Error al liberar la casilla", err);
                        }
                    );
                },
                err => {
                    errorInterno(resp, "Error al finalizar la reserva", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al buscar la casilla", err);
        }
    );
}

function misReservas(req, resp) {
    Reservas.find({ "usuario": req.usuario.id }).then(
        (reservas) => {
            resp.status(200).send({ "message": "reservas encontradas", "reservas": reservas });
        },
        err => {
            errorInterno(resp, "Error al consultar las reservas", err);
        }
    );
}

function alertasOrganizacion(req, resp) {
    let organizacionId = req.params.organizacionId;

    if (!validacion.idValido(organizacionId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    membresiaHelper.esMiembro(req.usuario.id, organizacionId).then(
        (esMiembro) => {
            if (!esMiembro) {
                return resp.status(403).send({ "message": "No pertenece a esta organizacion" });
            }

            Organizaciones.findById(organizacionId).then(
                (organizacion) => {
                    if (!organizacion) {
                        return resp.status(404).send({ "message": "Organizacion no encontrada" });
                    }

                    let zona = validacion.zonaHorariaValida(organizacion.zonaHoraria) ? organizacion.zonaHoraria : moment.tz.guess();

                    Reservas.find({ "organizacion": organizacionId, "estado": "activa" })
                        .populate("casilla", "codigo seccion estado tipo")
                        .populate("usuario", "nombre apellido telefono")
                        .then(
                            (reservas) => {
                                let ahora = moment().tz(zona);

                                const vencidas = reservas
                                    .map((reserva) => {
                                        const horaInicio = moment(reserva.horaInicio).tz(zona);
                                        const horaFin = horaInicio.clone().add(reserva.duracionHoras, 'hours');
                                        return { reserva, horaInicio, horaFin };
                                    })
                                    .filter(({ horaFin }) => ahora.isAfter(horaFin))
                                    .map(({ reserva, horaInicio, horaFin }) => ({
                                        "_id": reserva._id,
                                        "reserva": reserva._id,
                                        "placa": reserva.placa,
                                        "casilla": reserva.casilla,
                                        "usuario": reserva.usuario,
                                        "duracionHoras": reserva.duracionHoras,
                                        "horaInicio": horaInicio.format("YYYY-MM-DD HH:mm"),
                                        "horaFin": horaFin.format("YYYY-MM-DD HH:mm"),
                                        "horasVencidas": ahora.diff(horaFin, 'hours'),
                                        "horasExcedidas": Math.round((ahora.diff(horaFin, 'minutes') / 60) * 10) / 10,
                                        "zonaHoraria": zona
                                    }));

                                resp.status(200).send({ "message": "alertas encontradas", "zonaHoraria": zona, "alertas": vencidas });
                            },
                            err => {
                                errorInterno(resp, "Error al consultar las reservas", err);
                            }
                        );
                },
                err => {
                    errorInterno(resp, "Error al buscar la organizacion", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al validar la pertenencia", err);
        }
    );
}

module.exports = { crearReserva, finalizarReserva, misReservas, alertasOrganizacion };
