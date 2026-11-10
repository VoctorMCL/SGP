'use strict';

let Organizaciones = require("../models/organizacion");
let Membresias = require("../models/membresia");
let Casillas = require("../models/casilla");
let membresiaHelper = require("../helpers/membresia");
let validacion = require("../helpers/validacion");
let { errorInterno } = require("../helpers/respuestas");

let tiposEntidadValidos = ['Residencial', 'Comercial', 'Mixto', 'Publico', 'Privado'];

function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let colasPorOrganizacion = new Map();

/**
 * Serializa las operaciones de una misma organizacion. Asi dos personas no
 * pueden unirse al mismo tiempo y dejar el total por encima del limite.
 */
function conBloqueoOrganizacion(organizacionId, tarea) {
    let clave = String(organizacionId);
    let anterior = colasPorOrganizacion.get(clave) || Promise.resolve();
    let ejecucion = anterior.then(tarea);
    let cola = ejecucion.then(() => undefined, () => undefined);

    colasPorOrganizacion.set(clave, cola);

    cola.then(() => {
        if (colasPorOrganizacion.get(clave) === cola) {
            colasPorOrganizacion.delete(clave);
        }
    });

    return ejecucion;
}

function banderasValidas(requestBody) {
    let banderas = ['reservasPublicas', 'cobroAutomatico', 'cobroPorHora', 'acceso24_7'];

    for (let bandera of banderas) {
        if (requestBody[bandera] !== undefined && !validacion.booleano(requestBody[bandera])) {
            return false;
        }
    }
    return true;
}

function crearOrganizacion(req, resp) {
    let requestBody = req.body || {};

    if (!requestBody.nombre || !requestBody.nit || !requestBody.tipoEntidad || !requestBody.direccion
        || requestBody.totalPuestos === undefined || requestBody.totalPuestos === null
        || requestBody.limiteMiembros === undefined || requestBody.limiteMiembros === null
        || !requestBody.zonaHoraria) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios de la organizacion" });
    }
    else if (!tiposEntidadValidos.includes(requestBody.tipoEntidad)) {
        return resp.status(400).send({ "message": "El tipo de entidad debe ser Residencial, Comercial, Mixto, Publico o Privado" });
    }
    else if (!validacion.texto(requestBody.nombre) || !validacion.texto(requestBody.nit) || !validacion.texto(requestBody.direccion)) {
        return resp.status(400).send({ "message": "nombre, nit y direccion deben ser texto" });
    }
    else if (!validacion.nitValido(requestBody.nit)) {
        return resp.status(400).send({ "message": "El NIT solo puede contener numeros, puntos y guiones, por ejemplo 890.984.812-5" });
    }
    else if (!validacion.numeroEnteroPositivo(requestBody.totalPuestos) || !validacion.numeroEnteroPositivo(requestBody.limiteMiembros)) {
        return resp.status(400).send({ "message": "totalPuestos y limiteMiembros deben ser numeros enteros mayores que cero" });
    }
    else if (!validacion.zonaHorariaValida(requestBody.zonaHoraria)) {
        return resp.status(400).send({ "message": "zonaHoraria debe ser una zona valida, por ejemplo America/Bogota" });
    }
    else if (requestBody.descripcion !== undefined && typeof requestBody.descripcion !== 'string') {
        return resp.status(400).send({ "message": "descripcion debe ser texto" });
    }
    else if (!banderasValidas(requestBody)) {
        return resp.status(400).send({ "message": "reservasPublicas, cobroAutomatico, cobroPorHora y acceso24_7 deben ser true o false" });
    }

    let organizacion = new Organizaciones({
        "nombre": requestBody.nombre,
        "nit": requestBody.nit.trim(),
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
                    errorInterno(resp, "Error al crear la membresia del creador", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al crear la organizacion", err);
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
            errorInterno(resp, "Error al consultar organizaciones", err);
        }
    );
}

function unirseOrganizacion(req, resp) {
    let requestBody = req.body || {};
    let codigoInvitacion = requestBody.codigoInvitacion;

    if (!codigoInvitacion || !validacion.texto(codigoInvitacion)) {
        return resp.status(400).send({ "message": "Debe enviar el codigoInvitacion" });
    }

    codigoInvitacion = codigoInvitacion.trim().toUpperCase();

    Organizaciones.findOne({ "codigoInvitacion": codigoInvitacion }).then(
        (organizacion) => {
            if (!organizacion) {
                return resp.status(404).send({ "message": "Codigo de invitacion invalido" });
            }

            conBloqueoOrganizacion(organizacion._id, () => {
                return Membresias.findOne({ "usuario": req.usuario.id, "organizacion": organizacion._id }).then(
                    (membresiaExistente) => {
                        if (membresiaExistente) {
                            return resp.status(400).send({ "message": "Ya pertenece a esta organizacion" });
                        }

                        return Membresias.countDocuments({ "organizacion": organizacion._id }).then(
                            (totalMiembros) => {
                                let limite = Number.isInteger(organizacion.limiteMiembros)
                                    ? organizacion.limiteMiembros
                                    : Infinity;

                                if (totalMiembros >= limite) {
                                    return resp.status(400).send({ "message": "La organizacion alcanzo el limite de miembros" });
                                }

                                let membresia = new Membresias({
                                    "usuario": req.usuario.id,
                                    "organizacion": organizacion._id
                                });

                                return membresia.save().then(
                                    () => {
                                        resp.status(201).send({ "message": "se unio a la organizacion", "organizacion": organizacion });
                                    },
                                    err => {
                                        errorInterno(resp, "Error al unirse a la organizacion", err);
                                    }
                                );
                            },
                            err => {
                                errorInterno(resp, "Error al contar los miembros", err);
                            }
                        );
                    },
                    err => {
                        errorInterno(resp, "Error al buscar la membresia", err);
                    }
                );
            }).catch((err) => {
                if (!resp.headersSent) {
                    errorInterno(resp, "Error al unirse a la organizacion", err);
                }
            });
        },
        err => {
            errorInterno(resp, "Error al buscar la organizacion", err);
        }
    );
}

async function editarOrganizacion(req, resp) {
    let organizacionId = req.params.id;
    let requestBody = req.body || {};

    if (!validacion.idValido(organizacionId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

    if (requestBody.tipoEntidad && !tiposEntidadValidos.includes(requestBody.tipoEntidad)) {
        return resp.status(400).send({ "message": "El tipo de entidad debe ser Residencial, Comercial, Mixto, Publico o Privado" });
    }

    if (requestBody.nombre !== undefined && !validacion.texto(requestBody.nombre)) {
        return resp.status(400).send({ "message": "nombre debe ser texto" });
    }

    if (requestBody.nit !== undefined && !validacion.nitValido(requestBody.nit)) {
        return resp.status(400).send({ "message": "El NIT solo puede contener numeros, puntos y guiones, por ejemplo 890.984.812-5" });
    }

    if (requestBody.direccion !== undefined && !validacion.texto(requestBody.direccion)) {
        return resp.status(400).send({ "message": "direccion debe ser texto" });
    }

    if (requestBody.descripcion !== undefined && typeof requestBody.descripcion !== 'string') {
        return resp.status(400).send({ "message": "descripcion debe ser texto" });
    }

    if (requestBody.totalPuestos !== undefined
        && (!validacion.numero(requestBody.totalPuestos) || !Number.isInteger(requestBody.totalPuestos) || requestBody.totalPuestos < 0)) {
        return resp.status(400).send({ "message": "totalPuestos debe ser un numero entero mayor o igual que cero" });
    }

    if (requestBody.limiteMiembros !== undefined && !validacion.numeroEnteroPositivo(requestBody.limiteMiembros)) {
        return resp.status(400).send({ "message": "limiteMiembros debe ser un numero entero mayor que cero" });
    }

    if (requestBody.zonaHoraria !== undefined && !validacion.zonaHorariaValida(requestBody.zonaHoraria)) {
        return resp.status(400).send({ "message": "zonaHoraria debe ser una zona valida, por ejemplo America/Bogota" });
    }

    if (!banderasValidas(requestBody)) {
        return resp.status(400).send({ "message": "reservasPublicas, cobroAutomatico, cobroPorHora y acceso24_7 deben ser true o false" });
    }

    let camposActualizables = [
        'nombre', 'nit', 'tipoEntidad', 'direccion', 'descripcion', 'totalPuestos',
        'limiteMiembros', 'zonaHoraria', 'reservasPublicas', 'cobroAutomatico',
        'cobroPorHora', 'acceso24_7'
    ];

    if (!camposActualizables.some((campo) => requestBody[campo] !== undefined)) {
        return resp.status(400).send({ "message": "No hay campos validos para actualizar" });
    }

    try {
        let organizacion = await Organizaciones.findById(organizacionId);

        if (!organizacion) {
            return resp.status(404).send({ "message": "Organizacion no encontrada" });
        }
        if (organizacion.creadoPor.toString() !== req.usuario.id) {
            return resp.status(403).send({ "message": "Solo el creador de la organizacion puede modificarla" });
        }

        if (requestBody.totalPuestos !== undefined) {
            let casillasExistentes = await Casillas.countDocuments({
                "organizacion": organizacion._id,
                "tipo": { $in: ['standard', 'discapacitados', 'electrico'] }
            });

            if (requestBody.totalPuestos < casillasExistentes) {
                return resp.status(400).send({ "message": "La organizacion ya tiene " + casillasExistentes + " puestos, no puede bajar totalPuestos por debajo de eso" });
            }
        }

        if (requestBody.limiteMiembros !== undefined) {
            let miembrosActuales = await Membresias.countDocuments({ "organizacion": organizacion._id });

            if (requestBody.limiteMiembros < miembrosActuales) {
                return resp.status(400).send({ "message": "La organizacion ya tiene " + miembrosActuales + " miembros, no puede bajar limiteMiembros por debajo de eso" });
            }
        }

        aplicarCambiosOrganizacion(organizacion, requestBody, resp);
    }
    catch (err) {
        errorInterno(resp, "Error al actualizar la organizacion", err);
    }
}

function aplicarCambiosOrganizacion(organizacion, requestBody, resp) {
    if (requestBody.nombre) organizacion.nombre = requestBody.nombre;
    if (requestBody.nit) organizacion.nit = requestBody.nit.trim();
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
            errorInterno(resp, "Error al actualizar la organizacion", err);
        }
    );
}

function listarMiembros(req, resp) {
    let organizacionId = req.params.id;

    if (!validacion.idValido(organizacionId)) {
        return resp.status(400).send({ "message": "Id invalido" });
    }

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
                            errorInterno(resp, "Error al consultar los miembros", err);
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
}

module.exports = { crearOrganizacion, misOrganizaciones, unirseOrganizacion, editarOrganizacion, listarMiembros };
