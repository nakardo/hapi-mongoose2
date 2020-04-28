'use strict';

const Mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const MongooseOptions = exports.mongooseOptions = Joi.object()
    .keys({
        uri: Joi.string()
            .trim()
            .required(),
        mongooseOptions: Joi.object()
            .keys({
                auth: Joi.object().keys({
                    user: Joi.string().trim(),
                    password: Joi.string().trim()
                }),
                autoIndex: Joi.boolean(),
                bufferCommands: Joi.boolean()
            })
            .unknown()
    })
    .rename('options', 'mongooseOptions');

const Connection = exports.connection = MongooseOptions.keys({
    alias: Joi.string().trim(),
    loadSchemasFrom: Joi.alternatives()
        .match('one')
        .try(
            Joi.object().pattern(
                Joi.string(),
                Joi.object().instance(Mongoose.Schema)
            ),
            Joi.array().items(Joi.string()).default([])
        )
}).meta('connection');

exports.options = Joi.object()
    .keys({
        connection: Connection,
        connections: Joi.array().items(Connection.required()),
        decorations: Joi.array()
            .items(
                Joi.string().valid('server', 'request')
            )
            .default([])
    })
    .xor('connection', 'connections');
