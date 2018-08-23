'use strict';

const Mongoose = require('mongoose');

const animalSchema = new Mongoose.Schema({
    name: String,
    type: String,
    tags: { type: [String], index: true }
});

// FIXME(nakardo): indexes causes deprecation warnings.
// remove `--no-deprecation` flag from test script once it's fixed on mongoose.
// See: https://github.com/Automattic/mongoose/issues/6880

animalSchema.index({ name: 1, type: -1 });

module.exports = animalSchema;
