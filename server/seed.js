'use strict';

require('dotenv').config();
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');
let moment = require('moment-timezone');

let Usuarios = require('./models/usuario');
let Organizaciones = require('./models/organizacion');
let Membresias = require('./models/membresia');
let Casillas = require('./models/casilla');
let Reservas = require('./models/reserva');

let MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/parqueo";

async function ejecutarSeed() {
    if (mongoose.connection.readyState !== 1) {
        console.log("Conectando a MongoDB en:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Conectado con éxito.");
    }

    console.log("Limpiando colecciones anteriores...");
    await Usuarios.deleteMany({});
    await Organizaciones.deleteMany({});
    await Membresias.deleteMany({});
    await Casillas.deleteMany({});
    await Reservas.deleteMany({});

    console.log("Creando usuarios iniciales...");
    let passwordHash = bcrypt.hashSync("123456", 10);

    let admin = await Usuarios.create({
        nombre: "Ricardo",
        apellido: "Jaraba",
        documento: "1000100011",
        telefono: "3001234567",
        correo: "admin@sgp.com",
        password: passwordHash,
        placas: ["ABC-123"],
        rol: "administrador"
    });

    let guardia = await Usuarios.create({
        nombre: "Carlos",
        apellido: "Ruiz",
        documento: "1000200022",
        telefono: "3009876543",
        correo: "guardia@sgp.com",
        password: passwordHash,
        placas: [],
        rol: "guardia"
    });

    let conductor1 = await Usuarios.create({
        nombre: "Victor",
        apellido: "Cordoba",
        documento: "1000300033",
        telefono: "3105556677",
        correo: "conductor@sgp.com",
        password: passwordHash,
        placas: ["XYZ-789", "ABC-123"],
        rol: "usuario"
    });

    let conductor2 = await Usuarios.create({
        nombre: "Roberto",
        apellido: "Gomez",
        documento: "1000400044",
        telefono: "3154443322",
        correo: "roberto@sgp.com",
        password: passwordHash,
        placas: ["KLR-650"],
        rol: "usuario"
    });

    console.log("Creando organizaciones...");
    let orgAguas = await Organizaciones.create({
        nombre: "Residencial Aguas del Bosque",
        nit: "900123456-1",
        tipoEntidad: "Residencial",
        direccion: "Calle 10 # 45-20, Itagüí",
        descripcion: "Parqueadero residencial privado Aguas del Bosque con control inteligente de casillas.",
        totalPuestos: 48,
        limiteMiembros: 150,
        zonaHoraria: "America/Bogota",
        reservasPublicas: true,
        cobroAutomatico: false,
        cobroPorHora: false,
        acceso24_7: true,
        codigoInvitacion: "BOSQUE2026",
        creadoPor: admin._id
    });

    let orgLasallista = await Organizaciones.create({
        nombre: "Unilasallista",
        nit: "890980123-4",
        tipoEntidad: "Comercial",
        direccion: "Carrera 51 # 118 Sur - 57, Caldas",
        descripcion: "Sede universitaria principal con control vehicular para estudiantes y docentes.",
        totalPuestos: 24,
        limiteMiembros: 200,
        zonaHoraria: "America/Bogota",
        reservasPublicas: true,
        cobroAutomatico: true,
        cobroPorHora: true,
        acceso24_7: false,
        codigoInvitacion: "UNILASALLISTA",
        creadoPor: admin._id
    });

    console.log("Creando membresías...");
    await Membresias.insertMany([
        { usuario: admin._id, organizacion: orgAguas._id },
        { usuario: admin._id, organizacion: orgLasallista._id },
        { usuario: guardia._id, organizacion: orgAguas._id },
        { usuario: guardia._id, organizacion: orgLasallista._id },
        { usuario: conductor1._id, organizacion: orgAguas._id },
        { usuario: conductor1._id, organizacion: orgLasallista._id },
        { usuario: conductor2._id, organizacion: orgAguas._id }
    ]);

    console.log("Creando casillas para Aguas del Bosque...");
    let secciones = ['A', 'B', 'C', 'D'];
    let casillasAguas = [];
    let ocupadasIniciales = new Set(['A6', 'B2', 'B3', 'B10', 'C1', 'C7', 'D4', 'D5']);

    for (let seccion of secciones) {
        for (let i = 1; i <= 12; i++) {
            let codigo = `${seccion}${i}`;
            let tipo = 'standard';
            if (seccion === 'A' && (i === 1 || i === 2)) tipo = 'discapacitados';
            if (seccion === 'B' && (i === 1 || i === 2)) tipo = 'electrico';

            let estado = ocupadasIniciales.has(codigo) ? 'ocupado' : 'libre';

            casillasAguas.push({
                organizacion: orgAguas._id,
                codigo: codigo,
                seccion: `Sección ${seccion}`,
                tipo: tipo,
                estado: estado
            });
        }
    }
    let casillasCreadas = await Casillas.insertMany(casillasAguas);

    console.log("Creando reservas iniciales...");
    let casillaB2 = casillasCreadas.find(c => c.codigo === 'B2');
    let casillaC1 = casillasCreadas.find(c => c.codigo === 'C1');
    let casillaA6 = casillasCreadas.find(c => c.codigo === 'A6');

    if (casillaB2) {
        await Reservas.create({
            casilla: casillaB2._id,
            organizacion: orgAguas._id,
            usuario: conductor1._id,
            placa: "XYZ-789",
            horaInicio: moment().subtract(6, 'hours').toDate(),
            duracionHoras: 2,
            estado: "activa"
        });
    }

    if (casillaC1) {
        await Reservas.create({
            casilla: casillaC1._id,
            organizacion: orgAguas._id,
            usuario: conductor2._id,
            placa: "KLR-650",
            horaInicio: moment().subtract(4, 'hours').toDate(),
            duracionHoras: 1,
            estado: "activa"
        });
    }

    if (casillaA6) {
        await Reservas.create({
            casilla: casillaA6._id,
            organizacion: orgAguas._id,
            usuario: conductor1._id,
            placa: "ABC-123",
            horaInicio: moment().subtract(30, 'minutes').toDate(),
            duracionHoras: 3,
            estado: "activa"
        });
    }

    let casillasLasallista = [];
    for (let seccion of ['A', 'B']) {
        for (let i = 1; i <= 12; i++) {
            casillasLasallista.push({
                organizacion: orgLasallista._id,
                codigo: `${seccion}${i}`,
                seccion: `Sección ${seccion}`,
                tipo: (i === 1 ? 'discapacitados' : 'standard'),
                estado: (i % 4 === 0 ? 'ocupado' : 'libre')
            });
        }
    }
    await Casillas.insertMany(casillasLasallista);

    return {
        message: "Seed ejecutado con éxito en MongoDB",
        usuarios: [
            { rol: "administrador", correo: "admin@sgp.com", password: "123456" },
            { rol: "guardia", correo: "guardia@sgp.com", password: "123456" },
            { rol: "usuario", correo: "conductor@sgp.com", password: "123456" }
        ],
        organizaciones: [
            { nombre: "Residencial Aguas del Bosque", codigoInvitacion: "BOSQUE2026", casillas: 48 },
            { nombre: "Unilasallista", codigoInvitacion: "UNILASALLISTA", casillas: 24 }
        ]
    };
}

if (require.main === module) {
    ejecutarSeed().then((res) => {
        console.log("====================================================");
        console.log("  SEED COMPLETADO CON ÉXITO");
        console.log("====================================================");
        console.log("Usuarios creados:");
        for (let u of res.usuarios) {
            console.log(`  - ${u.rol.padEnd(13)}: ${u.correo} / ${u.password}`);
        }
        console.log("Organizaciones creadas:");
        for (let o of res.organizaciones) {
            console.log(`  - ${o.nombre} (Código: ${o.codigoInvitacion})`);
        }
        console.log("====================================================");
        process.exit(0);
    }).catch(err => {
        console.error("Error durante el seed:", err);
        process.exit(1);
    });
}

module.exports = { ejecutarSeed };
