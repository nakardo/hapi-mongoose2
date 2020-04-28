'use strict';

const Mongoose = require('mongoose');

const personSchema = new Mongoose.Schema({
    name: String,
    lastname: String,
    dob: Date
});

module.exports = personSchema;
