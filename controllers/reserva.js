'use strict';

let moment = require("moment-timezone");
let Reservas = require("../models/reserva");
let Casillas = require("../models/casilla");
let Organizaciones = require("../models/organizacion");
let membresiaHelper = require("../helpers/membresia");
let auth = require("../helpers/auth");
let validacion = require("../helpers/validacion");

function crearReserva(req, resp) {
    let requestBody = req.body;

    if (!requestBody.casilla || !requestBody.placa || !requestBody.duracionHoras) {
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
                                "placa": requestBody.placa,
                                "horaInicio": new Date(),
                                "duracionHoras": requestBody.duracionHoras,
                                "estado": "activa"
                            });

                            reserva.save().then(
                                (reservaCreada) => {
                                    casilla.estado = 'ocupado';
                                    casilla.save().then(
                                        () => {
                                            resp.status(201).send({ "message": "reserva creada", "reserva": reservaCreada });
                                        },
                                        err => {
                                            resp.status(500).send({ "message": "Error al actualizar la casilla", "error": err });
                                        }
                                    );
                                },
                                err => {
                                    resp.status(500).send({ "message": "Error al crear la reserva", "error": err });
                                }
                            );
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al validar la pertenencia", "error": err });
                        }
                    );
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

            // Un guardia o un administrador solo puede finalizar reservas de las
            // organizaciones a las que pertenece. Si tiene varias, cualquiera de
            // ellas sirve.
            membresiaHelper.esMiembro(req.usuario.id, reserva.organizacion).then(
                (esMiembro) => {
                    if (!esMiembro) {
                        return resp.status(403).send({ "message": "No puede finalizar esta reserva" });
                    }
                    completarFinalizacion(reserva, resp);
                },
                err => {
                    resp.status(500).send({ "message": "Error al validar la pertenencia", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la reserva", "error": err });
        }
    );
}

// Primero se busca la casilla y se confirma que exista, y solo despues se
// finaliza la reserva y se libera la casilla. Al reves, una casilla que ya no
// existe dejaba la reserva finalizada y la casilla ocupada.
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
                            resp.status(200).send({ "message": "reserva finalizada", "reserva": reserva });
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al liberar la casilla", "error": err });
                        }
                    );
                },
                err => {
                    resp.status(500).send({ "message": "Error al finalizar la reserva", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la casilla", "error": err });
        }
    );
}

function misReservas(req, resp) {
    Reservas.find({ "usuario": req.usuario.id }).then(
        (reservas) => {
            resp.status(200).send({ "message": "reservas encontradas", "reservas": reservas });
        },
        err => {
            resp.status(500).send({ "message": "Error al consultar las reservas", "error": err });
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

            // La zona horaria de la organizacion es la que manda: una reserva se vence a
            // la hora local del parqueadero, no a la hora del servidor.
            Organizaciones.findById(organizacionId).then(
                (organizacion) => {
                    if (!organizacion) {
                        return resp.status(404).send({ "message": "Organizacion no encontrada" });
                    }

                    let zona = validacion.zonaHorariaValida(organizacion.zonaHoraria) ? organizacion.zonaHoraria : moment.tz.guess();

                    Reservas.find({ "organizacion": organizacionId, "estado": "activa" }).then(
                        (reservas) => {
                            let ahora = moment().tz(zona);
                            let alertas = reservas.map(reserva => {
                                let horaInicio = moment(reserva.horaInicio).tz(zona);
                                let horaFin = horaInicio.clone().add(reserva.duracionHoras, 'hours');
                                return {
                                    "reserva": reserva._id,
                                    "placa": reserva.placa,
                                    "casilla": reserva.casilla,
                                    "horaInicio": horaInicio.format("YYYY-MM-DD HH:mm"),
                                    "horaFin": horaFin.format("YYYY-MM-DD HH:mm"),
                                    "horasVencidas": ahora.diff(horaFin, 'hours'),
                                    "zonaHoraria": zona
                                };
                            });
                            let vencidas = alertas.filter(alerta => ahora.isAfter(alerta.horaFin));
                            resp.status(200).send({ "message": "alertas encontradas", "zonaHoraria": zona, "alertas": vencidas });
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al consultar las reservas", "error": err });
                        }
                    );
                },
                err => {
                    resp.status(500).send({ "message": "Error al buscar la organizacion", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al validar la pertenencia", "error": err });
        }
    );
}

module.exports = { crearReserva, finalizarReserva, misReservas, alertasOrganizacion };
