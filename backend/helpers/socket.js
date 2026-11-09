'use strict';

let io = null;

function init(server) {
    let { Server } = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log('Cliente conectado a WebSocket:', socket.id);

        socket.on('unirse:organizacion', (organizacionId) => {
            socket.join(`org_${organizacionId}`);
            console.log(`Socket ${socket.id} unido a sala org_${organizacionId}`);
        });

        socket.on('salir:organizacion', (organizacionId) => {
            socket.leave(`org_${organizacionId}`);
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });

    return io;
}

function getIO() {
    return io;
}

function emitirEvento(evento, datos, organizacionId) {
    if (!io) return;
    if (organizacionId) {
        io.to(`org_${organizacionId}`).emit(evento, datos);
        io.emit(evento, datos);
    } else {
        io.emit(evento, datos);
    }
}

module.exports = { init, getIO, emitirEvento };
