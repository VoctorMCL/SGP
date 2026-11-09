'use strict';

let Usuarios = require("../models/usuario");
let auth = require("../helpers/auth");
let validacion = require("../helpers/validacion");
let { errorInterno } = require("../helpers/respuestas");
let bcrypt = require("bcrypt");

let rolesValidos = ['administrador', 'guardia', 'usuario'];

function registrarUsuario(req, resp) {
    let requestBody = req.body || {};

    if (!requestBody.nombre || !requestBody.apellido || !requestBody.documento || !requestBody.telefono || !requestBody.correo || !requestBody.password) {
        return resp.status(400).send({ "message": "Faltan datos obligatorios del usuario" });
    }
    else if (!validacion.texto(requestBody.nombre) || !validacion.texto(requestBody.apellido) || !validacion.texto(requestBody.documento)) {
        return resp.status(400).send({ "message": "nombre, apellido y documento deben ser texto" });
    }
    else if (!validacion.texto(requestBody.correo) || requestBody.correo.indexOf('@') === -1 || requestBody.correo.indexOf('.') === -1) {
        return resp.status(400).send({ "message": "El correo no tiene un formato valido" });
    }
    else if (!validacion.texto(requestBody.password)) {
        return resp.status(400).send({ "message": "El password debe ser texto" });
    }
    else if (String(requestBody.telefono).trim().length !== 10 || isNaN(requestBody.telefono)) {
        return resp.status(400).send({ "message": "El telefono debe tener exactamente 10 digitos" });
    }
    else if (requestBody.rol && !rolesValidos.includes(requestBody.rol)) {
        return resp.status(400).send({ "message": "El rol debe ser administrador, guardia o usuario" });
    }
    else if (requestBody.placas && !Array.isArray(requestBody.placas)) {
        return resp.status(400).send({ "message": "Las placas deben enviarse como un arreglo de textos" });
    }
    else if (requestBody.placas && requestBody.placas.some(placa => !validacion.texto(placa))) {
        return resp.status(400).send({ "message": "Cada placa debe ser un texto no vacio" });
    }

    let nombre = validacion.normalizarNombre(requestBody.nombre);
    let apellido = validacion.normalizarNombre(requestBody.apellido);
    let documento = String(requestBody.documento).trim();
    let correo = String(requestBody.correo).trim().toLowerCase();
    let telefono = String(requestBody.telefono).trim();
    let placas = (requestBody.placas || []).map((placa) => String(placa).trim());

    if (placas.some((placa) => !validacion.placaValida(placa))) {
        return resp.status(400).send({ "message": "Cada placa debe tener el formato ABC-123 (tres letras y tres numeros)" });
    }

    placas = [...new Set(placas.map((placa) => validacion.normalizarPlaca(placa)))];

    Usuarios.findOne({ "correo": correo }).then(
        (usuarioExistente) => {
            if (usuarioExistente) {
                return resp.status(400).send({ "message": "Ya existe un usuario registrado con ese correo" });
            }

            Usuarios.findOne({ "documento": documento }).then(
                (documentoExistente) => {
                    if (documentoExistente) {
                        return resp.status(400).send({ "message": "Ya existe un usuario registrado con ese documento" });
                    }

                    let usuario = new Usuarios({
                        "nombre": nombre,
                        "apellido": apellido,
                        "documento": documento,
                        "telefono": telefono,
                        "correo": correo,
                        "password": bcrypt.hashSync(requestBody.password, 10),
                        "placas": placas,
                        "rol": requestBody.rol || 'usuario'
                    });

                    usuario.save().then(
                        (usuarioCreado) => {
                            let datos = usuarioCreado.toObject();
                            delete datos.password;
                            resp.status(201).send({ "message": "usuario creado", "usuario": datos });
                        },
                        err => {
                            errorInterno(resp, "Error al crear el usuario", err);
                        }
                    );
                },
                err => {
                    errorInterno(resp, "Error al validar el documento", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al validar el correo", err);
        }
    );
}

function verificarDisponibilidad(req, resp) {
    let correo = validacion.texto(req.query.correo) ? req.query.correo.trim().toLowerCase() : null;
    let documento = validacion.texto(req.query.documento) ? req.query.documento.trim() : null;

    Promise.all([
        correo ? Usuarios.findOne({ "correo": correo }).then((usuario) => !!usuario) : Promise.resolve(false),
        documento ? Usuarios.findOne({ "documento": documento }).then((usuario) => !!usuario) : Promise.resolve(false)
    ]).then(
        ([correoEnUso, documentoEnUso]) => {
            resp.status(200).send({
                "correoDisponible": correo ? !correoEnUso : true,
                "documentoDisponible": documento ? !documentoEnUso : true
            });
        },
        err => {
            errorInterno(resp, "Error al verificar la disponibilidad", err);
        }
    );
}

function loguearUsuario(req, resp) {
    let requestBody = req.body || {};
    let correo = requestBody.correo;
    let password = requestBody.password;

    if (!validacion.texto(correo) || !validacion.texto(password)) {
        return resp.status(400).send({ "message": "Debe enviar un correo y password de tipo texto" });
    }

    Usuarios.findOne({ "correo": correo.toLowerCase() }).then(
        (usuario) => {
            if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
                return resp.status(401).send({ "message": "Correo o contraseña incorrectos" });
            }
            resp.status(200).send({ "token": auth.crearToken(usuario) });
        },
        err => {
            errorInterno(resp, "Error al loguear el usuario", err);
        }
    )
}

function recuperarPassword(req, resp) {
    let requestBody = req.body || {};
    let correo = requestBody.correo;
    let documento = requestBody.documento;
    let password = requestBody.password;

    if (!validacion.texto(correo) || !validacion.texto(documento) || !validacion.texto(password)) {
        return resp.status(400).send({ "message": "Debe enviar correo, documento y la nueva contraseña" });
    }

    if (correo.indexOf('@') === -1 || correo.indexOf('.') === -1) {
        return resp.status(400).send({ "message": "El correo no tiene un formato valido" });
    }

    if (password.trim().length < 6) {
        return resp.status(400).send({ "message": "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    Usuarios.findOne({ "correo": correo.toLowerCase() }).then(
        (usuario) => {
            if (!usuario || String(usuario.documento).trim() !== documento.trim()) {
                return resp.status(400).send({ "message": "El correo y el documento no coinciden con ningún usuario" });
            }

            usuario.password = bcrypt.hashSync(password, 10);
            usuario.save().then(
                () => {
                    resp.status(200).send({ "message": "Contraseña actualizada correctamente" });
                },
                err => {
                    errorInterno(resp, "Error al actualizar la contraseña", err);
                }
            );
        },
        err => {
            errorInterno(resp, "Error al validar los datos de recuperación", err);
        }
    );
}

function perfilUsuario(req, resp) {
    Usuarios.findById(req.usuario.id).then(
        (usuario) => {
            if (!usuario) {
                return resp.status(404).send({ "message": "Usuario no encontrado" });
            }
            let datos = usuario.toObject();
            delete datos.password;
            resp.status(200).send({ "message": "perfil encontrado", "usuario": datos });
        },
        err => {
            errorInterno(resp, "Error al consultar el perfil", err);
        }
    );
}

module.exports = { registrarUsuario, verificarDisponibilidad, loguearUsuario, recuperarPassword, perfilUsuario };
