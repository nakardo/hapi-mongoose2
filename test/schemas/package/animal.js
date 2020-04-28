'use strict';

const Mongoose = require('mongoose');

Mongoose.set('useCreateIndex', true);

const animalSchema = new Mongoose.Schema({
    name: String,
    type: String,
    tags: { type: [String], index: true }
});

animalSchema.index({ name: 1, type: -1 });

module.exports = animalSchema;
