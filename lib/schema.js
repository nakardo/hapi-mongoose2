'use strict';

const Joi = require('joi');

const MongooseOptions = exports.mongooseOptions = Joi.object()
    .keys({
        uri: Joi.string()
            .uri({ scheme: 'mongodb' })
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
    schemaPatterns: Joi.array()
        .items(Joi.string())
        .default([])
}).meta('connection');

exports.options = Joi.object()
    .keys({
        connection: Connection,
        connections: Joi.array().items(Connection.required())
    })
    .xor('connection', 'connections');
