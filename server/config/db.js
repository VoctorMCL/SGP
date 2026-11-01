'use strict';

const mongoose = require('mongoose');

async function connectDB(uri) {
    const MONGO_URI = uri || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/parqueo";

    try {
        const connection = await mongoose.connect(MONGO_URI);
        console.log('Conectado a MongoDB');
        return connection;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        throw error;
    }
}

module.exports = {
    connectDB
};
