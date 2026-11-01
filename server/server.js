'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const socketHelper = require('./helpers/socket');

const PORT = process.env.PORT || 2305;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/parqueo";

connectDB(MONGO_URI)
    .then(() => {
        const server = http.createServer(app);
        socketHelper.init(server);
        server.listen(PORT, () => {
            console.log(`Servidor SGP en puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('No se pudo iniciar el servidor:', err);
        process.exit(1);
    });
