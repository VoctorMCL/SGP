'use strict';

const mongoose = require('mongoose');
const app = require('../backend/app');

let isConnected = false;

async function conectarDB() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/parqueo";
    try {
        const db = await mongoose.connect(MONGO_URI);
        isConnected = db.connections[0].readyState === 1;
        console.log("Conectado a MongoDB en Vercel Serverless");
    } catch (err) {
        console.error("Error al conectar a MongoDB:", err);
    }
}

module.exports = async (req, res) => {
    await conectarDB();
    return app(req, res);
};
