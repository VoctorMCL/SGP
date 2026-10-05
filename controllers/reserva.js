'use strict';

let moment = require("moment");
let Reservas = require("../models/reserva");
let Casillas = require("../models/casilla");
let Organizaciones = require("../models/organizacion");
let membresiaHelper = require("../helpers/membresia");
let auth = require("../helpers/auth");

function crearReserva(req, resp) {
    let requestBody = req.body;

    if (!requestBody.casilla || !requestBody.placa || !requestBody.duracionHoras) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios de la reserva" });
    }
    else if (!Number.isInteger(requestBody.duracionHoras) || requestBody.duracionHoras <= 0) {
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

    Reservas.findById(reservaId).then(
        (reserva) => {
            if (!reserva) {
                return resp.status(404).send({ "message": "Reserva no encontrada" });
            }
            if (reserva.estado !== 'activa') {
                return resp.status(400).send({ "message": "La reserva ya esta finalizada" });
            }

            let esElMismoUsuario = reserva.usuario.toString() === req.usuario.id;
            let esStaff = auth.esStaff(req.usuario.rol);

            if (!esElMismoUsuario && !esStaff) {
                return resp.status(403).send({ "message": "No puede finalizar esta reserva" });
            }

            reserva.estado = 'finalizada';
            reserva.save().then(
                () => {
                    Casillas.findById(reserva.casilla).then(
                        (casilla) => {
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
                            resp.status(500).send({ "message": "Error al buscar la casilla", "error": err });
                        }
                    );
                },
                err => {
                    resp.status(500).send({ "message": "Error al finalizar la reserva", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la reserva", "error": err });
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

    membresiaHelper.esMiembro(req.usuario.id, organizacionId).then(
        (esMiembro) => {
            if (!esMiembro) {
                return resp.status(403).send({ "message": "No pertenece a esta organizacion" });
            }

            Reservas.find({ "organizacion": organizacionId, "estado": "activa" }).then(
                (reservas) => {
                    let ahora = moment();
                    let vencidas = reservas.filter(reserva => {
                        let horaFin = moment(reserva.horaInicio).add(reserva.duracionHoras, 'hours');
                        return ahora.isAfter(horaFin);
                    });
                    resp.status(200).send({ "message": "alertas encontradas", "alertas": vencidas });
                },
                err => {
                    resp.status(500).send({ "message": "Error al consultar las reservas", "error": err });
                }
            );
        }
    );
}

module.exports = { crearReserva, finalizarReserva, misReservas, alertasOrganizacion };
