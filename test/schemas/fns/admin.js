'use strict';

const Mongoose = require('mongoose');

const adminSchema = new Mongoose.Schema({
    name: String,
    last: String
});

module.exports = function (server) {

    adminSchema.post('save', (doc) => {

        server.events.emit('admin-created', doc.toObject());
    });

    return adminSchema;
};
