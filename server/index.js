'use strict';

require('dotenv').config();
let http = require('http');
let mongoose = require('mongoose');
let application = require('./applications');
let socketHelper = require('./helpers/socket');

let PORT = process.env.PORT || 2305;
let MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/parqueo";

mongoose.connect(MONGO_URI).then(
    () => {
        let server = http.createServer(application);
        socketHelper.init(server);
        server.listen(PORT, () => {
            console.log(`Servidor SGP en puerto ${PORT}`);
        });
    },
    err => {
        console.error("Error conectando a MongoDB:", err);
    }
);
