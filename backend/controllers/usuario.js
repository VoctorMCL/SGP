'use strict';

let Usuarios = require("../models/usuario");
let auth = require("../helpers/auth");
let validacion = require("../helpers/validacion");
let bcrypt = require("bcrypt");

let rolesValidos = ['administrador', 'guardia', 'usuario'];

function registrarUsuario(req, resp) {
    let requestBody = req.body;

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

    Usuarios.findOne({ "correo": requestBody.correo.toLowerCase() }).then(
        (usuarioExistente) => {
            if (usuarioExistente) {
                return resp.status(400).send({ "message": "Ya existe un usuario registrado con ese correo" });
            }

            Usuarios.findOne({ "documento": requestBody.documento }).then(
                (documentoExistente) => {
                    if (documentoExistente) {
                        return resp.status(400).send({ "message": "Ya existe un usuario registrado con ese documento" });
                    }

                    let usuario = new Usuarios({
                        "nombre": requestBody.nombre,
                        "apellido": requestBody.apellido,
                        "documento": requestBody.documento,
                        "telefono": requestBody.telefono,
                        "correo": requestBody.correo.toLowerCase(),
                        "password": bcrypt.hashSync(requestBody.password, 10),
                        "placas": requestBody.placas || [],
                        "rol": requestBody.rol || 'usuario'
                    });

                    usuario.save().then(
                        (usuarioCreado) => {
                            let datos = usuarioCreado.toObject();
                            delete datos.password;
                            resp.status(200).send({ "message": "usuario creado", "usuario": datos });
                        },
                        err => {
                            resp.status(500).send({ "message": "Error al crear el usuario", "error": err });
                        }
                    );
                },
                err => {
                    resp.status(500).send({ "message": "Error al validar el documento", "error": err });
                }
            );
        },
        err => {
            resp.status(500).send({ "message": "Error al validar el correo", "error": err });
        }
    );
}

function loguearUsuario(req, resp) {
    let correo = req.body.correo;
    let password = req.body.password;

    if (!validacion.texto(correo) || !validacion.texto(password)) {
        return resp.status(400).send({ "message": "Debe enviar un correo y password de tipo texto" });
    }

    Usuarios.findOne({ "correo": correo.toLowerCase() }).then(
        (usuario) => {
            if (!usuario) {
                return resp.status(404).send({ "message": "No existe el usuario" });
            }
            if (!bcrypt.compareSync(password, usuario.password)) {
                return resp.status(401).send({ "message": "Contraseña incorrecta" });
            }
            resp.status(200).send({ "token": auth.crearToken(usuario) });
        },
        err => {
            resp.status(500).send({ "message": "Error al loguear el usuario", "error": err });
        }
    )
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
            resp.status(500).send({ "message": "Error al consultar el perfil", "error": err });
        }
    );
}

module.exports = { registrarUsuario, loguearUsuario, perfilUsuario };
