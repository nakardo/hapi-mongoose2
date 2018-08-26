'use strict';

const Path = require('path');
const Hoek = require('hoek');
const Joi = require('joi');
const Mongoose = require('mongoose');
const Capitalize = require('lodash.capitalize');
const Globby = require('globby');
const Schema = require('./schema');

const defaults = {
    connection: {
        mongooseOptions: {
            useNewUrlParser: true
        }
    }
};

const createModel = async function (server, connection, info) {

    let file = require(`${info.dir}/${info.base}`);
    if (typeof file === 'function') {
        file = await file(server);
    }
    if (typeof file === 'object' &&
        file.constructor.name === 'Schema') {
        return connection.model(info.name, file);
    }

    throw new Error(`unable to create model for file: ${info.base}`);
};

const connect = async function (server, connections) {

    const mongos = {};

    for (const options of connections) {
        const settings = Hoek.applyToDefaults(defaults.connection, options);
        const { alias, uri, mongooseOptions, schemaPatterns } = settings;
        const connection = await Mongoose.createConnection(
            uri,
            mongooseOptions,
        );
        server.log(['info', 'hapi-mongoose2'], `connected to: ${uri}`);

        const models = {};
        const files = await Globby(schemaPatterns, { absolute: true });
        for (const info of files.map(Path.parse)) {
            const name = Capitalize(info.name);
            models[name] = await createModel(server, connection, info);
            server.log(
                ['info', 'hapi-mongoose2'],
                `registered model '${name}' for database '${connection.name}'`,
            );
        };

        const mongo = { models, connection };
        if (connections.length > 1) {
            mongos[alias || connection.name] = mongo;
            continue;
        }
        return mongo;
    }

    return mongos;
};

const register = async function (server, options) {

    const settings = await Joi.validate(options, Schema.options);
    server.app.mongo = await connect(
        server,
        settings.connections || [settings.connection],
    );
};

module.exports = {
    pkg: require('../package.json'),
    register
};
