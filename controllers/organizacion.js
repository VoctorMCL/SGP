'use strict';

let Organizaciones = require("../models/organizacion");
let Membresias = require("../models/membresia");
let Casillas = require("../models/casilla");
let membresiaHelper = require("../helpers/membresia");

let tiposEntidadValidos = ['Residencial', 'Comercial', 'Mixto', 'Publico'];

function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function crearOrganizacion(req, resp) {
    let requestBody = req.body;

    if (!requestBody.nombre || !requestBody.nit || !requestBody.tipoEntidad || !requestBody.direccion || !requestBody.totalPuestos || !requestBody.limiteMiembros || !requestBody.zonaHoraria) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios de la organizacion" });
    }
    else if (!tiposEntidadValidos.includes(requestBody.tipoEntidad)) {
        return resp.status(400).send({ "message": "El tipo de entidad debe ser Residencial, Comercial, Mixto o Publico" });
    }
    else if (requestBody.totalPuestos <= 0 || requestBody.limiteMiembros <= 0) {
        return resp.status(400).send({ "message": "totalPuestos y limiteMiembros deben ser mayores que cero" });
    }

    let organizacion = new Organizaciones({
        "nombre": requestBody.nombre,
        "nit": requestBody.nit,
        "tipoEntidad": requestBody.tipoEntidad,
        "direccion": requestBody.direccion,
        "descripcion": requestBody.descripcion || "",
        "totalPuestos": requestBody.totalPuestos,
        "limiteMiembros": requestBody.limiteMiembros,
        "zonaHoraria": requestBody.zonaHoraria,
        "reservasPublicas": requestBody.reservasPublicas || false,
        "cobroAutomatico": requestBody.cobroAutomatico || false,
        "cobroPorHora": requestBody.cobroPorHora || false,
        "acceso24_7": requestBody.acceso24_7 || false,
        "codigoInvitacion": generarCodigo(),
        "creadoPor": req.usuario.id
    });

    organizacion.save().then(
        (organizacionCreada) => {
            let membresia = new Membresias({
                "usuario": req.usuario.id,
                "organizacion": organizacionCreada._id
            });
            membresia.save().then(
                () => {
                    resp.status(201).send({ "message": "organizacion creada", "organizacion": organizacionCreada });
                },
                err => {
                    resp.status(500).send({ "message": "Error al crear la membresia del creador", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al crear la organizacion", "error": err });
        }
    );
}

function misOrganizaciones(req, resp) {
    Membresias.find({ "usuario": req.usuario.id }).populate("organizacion").then(
        (membresias) => {
            let organizaciones = membresias.map(m => m.organizacion);
            resp.status(200).send({ "message": "organizaciones encontradas", "organizaciones": organizaciones });
        },
        err => {
            resp.status(500).send({ "message": "Error al consultar organizaciones", "error": err });
        }
    );
}

function unirseOrganizacion(req, resp) {
    let codigoInvitacion = req.body.codigoInvitacion;

    if (!codigoInvitacion) {
        return resp.status(400).send({ "message": "Debe enviar el codigoInvitacion" });
    }

    Organizaciones.findOne({ "codigoInvitacion": codigoInvitacion }).then(
        (organizacion) => {
            if (!organizacion) {
                return resp.status(404).send({ "message": "Codigo de invitacion invalido" });
            }

            Membresias.findOne({ "usuario": req.usuario.id, "organizacion": organizacion._id }).then(
                (membresiaExistente) => {
                    if (membresiaExistente) {
                        return resp.status(400).send({ "message": "Ya pertenece a esta organizacion" });
                    }

                    Membresias.countDocuments({ "organizacion": organizacion._id }).then(
                        (totalMiembros) => {
                            if (totalMiembros >= organizacion.limiteMiembros) {
                                return resp.status(400).send({ "message": "La organizacion alcanzo el limite de miembros" });
                            }

                            let membresia = new Membresias({
                                "usuario": req.usuario.id,
                                "organizacion": organizacion._id
                            });

                            membresia.save().then(
                                () => {
                                    resp.status(201).send({ "message": "se unio a la organizacion", "organizacion": organizacion });
                                },
                                err => {
                                    resp.status(500).send({ "message": "Error al unirse a la organizacion", "error": err });
                                }
                            );
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

function editarOrganizacion(req, resp) {
    let organizacionId = req.params.id;
    let requestBody = req.body;

    if (requestBody.tipoEntidad && !tiposEntidadValidos.includes(requestBody.tipoEntidad)) {
        return resp.status(400).send({ "message": "El tipo de entidad debe ser Residencial, Comercial, Mixto o Publico" });
    }

    Organizaciones.findById(organizacionId).then(
        (organizacion) => {
            if (!organizacion) {
                return resp.status(404).send({ "message": "Organizacion no encontrada" });
            }
            if (organizacion.creadoPor.toString() !== req.usuario.id) {
                return resp.status(403).send({ "message": "Solo el creador de la organizacion puede modificarla" });
            }

            if (requestBody.totalPuestos !== undefined) {
                Casillas.countDocuments({ "organizacion": organizacion._id }).then(
                    (casillasExistentes) => {
                        if (requestBody.totalPuestos < casillasExistentes) {
                            return resp.status(400).send({ "message": "La organizacion ya tiene " + casillasExistentes + " casillas, no puede bajar totalPuestos por debajo de eso" });
                        }
                        aplicarCambiosOrganizacion(organizacion, requestBody, resp);
                    },
                    err => {
                        resp.status(500).send({ "message": "Error al validar las casillas existentes", "error": err });
                    }
                );
            }
            else {
                aplicarCambiosOrganizacion(organizacion, requestBody, resp);
            }
        },
        err => {
            resp.status(500).send({ "message": "Error al buscar la organizacion", "error": err });
        }
    );
}

function aplicarCambiosOrganizacion(organizacion, requestBody, resp) {
    if (requestBody.nombre) organizacion.nombre = requestBody.nombre;
    if (requestBody.nit) organizacion.nit = requestBody.nit;
    if (requestBody.tipoEntidad) organizacion.tipoEntidad = requestBody.tipoEntidad;
    if (requestBody.direccion) organizacion.direccion = requestBody.direccion;
    if (requestBody.descripcion !== undefined) organizacion.descripcion = requestBody.descripcion;
    if (requestBody.totalPuestos !== undefined) organizacion.totalPuestos = requestBody.totalPuestos;
    if (requestBody.limiteMiembros !== undefined) organizacion.limiteMiembros = requestBody.limiteMiembros;
    if (requestBody.zonaHoraria) organizacion.zonaHoraria = requestBody.zonaHoraria;
    if (requestBody.reservasPublicas !== undefined) organizacion.reservasPublicas = requestBody.reservasPublicas;
    if (requestBody.cobroAutomatico !== undefined) organizacion.cobroAutomatico = requestBody.cobroAutomatico;
    if (requestBody.cobroPorHora !== undefined) organizacion.cobroPorHora = requestBody.cobroPorHora;
    if (requestBody.acceso24_7 !== undefined) organizacion.acceso24_7 = requestBody.acceso24_7;

    organizacion.save().then(
        (organizacionActualizada) => {
            resp.status(200).send({ "message": "organizacion actualizada", "organizacion": organizacionActualizada });
        },
        err => {
            resp.status(500).send({ "message": "Error al actualizar la organizacion", "error": err });
        }
    );
}

function listarMiembros(req, resp) {
    let organizacionId = req.params.id;

    Organizaciones.findById(organizacionId).then(
        (organizacion) => {
            if (!organizacion) {
                return resp.status(404).send({ "message": "Organizacion no encontrada" });
            }

            membresiaHelper.esMiembro(req.usuario.id, organizacionId).then(
                (esMiembro) => {
                    if (!esMiembro && organizacion.creadoPor.toString() !== req.usuario.id) {
                        return resp.status(403).send({ "message": "No pertenece a esta organizacion" });
                    }

                    Membresias.find({ "organizacion": organizacion._id }).populate("usuario").then(
                        (membresias) => {
                            let miembros = membresias.map(m => {
                                let usuario = m.usuario.toObject();
                                delete usuario.password;
                                return { "membresia": m._id, "usuario": usuario };
                            });
                            resp.status(200).send({ "message": "miembros encontrados", "miembros": miembros });
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al consultar los miembros", "error": err });
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

module.exports = { crearOrganizacion, misOrganizaciones, unirseOrganizacion, editarOrganizacion, listarMiembros };
