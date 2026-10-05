'use strict';

let mongoose = require('mongoose');
let application = require('./applications');

mongoose.connect("mongodb://localhost:27017/parqueo").then(
    () => {
        console.log("Conexion exitosa");
        application.listen(2305);
    },
    err => {
        console.error(err);
    }
);
