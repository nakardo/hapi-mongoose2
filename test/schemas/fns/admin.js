'use strict';

const Mongoose = require('mongoose');

module.exports = function (server) {

    const schema = new Mongoose.Schema({
        name: String,
        last: String
    });

    schema.post('save', (doc) => {

        server.events.emit('admin-created', doc.toObject());
    });

    return schema;
};
