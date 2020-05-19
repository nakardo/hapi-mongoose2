'use strict';

const Path = require('path');
const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');
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

    let mongos = {};

    for (const options of connections) {
        const settings = Hoek.applyToDefaults(defaults.connection, options);
        const { uri, mongooseOptions, loadSchemasFrom } = settings;
        const connection = await Mongoose.createConnection(
            uri,
            mongooseOptions
        );
        server.log(
            ['info', 'hapi-mongoose2'],
            `connected to database: '${connection.name}'`
        );

        const models = {};
        if (Array.isArray(loadSchemasFrom)) {
            const files = await Globby(loadSchemasFrom, { absolute: true });
            for (const info of files.map(Path.parse)) {
                const name = Capitalize(info.name);
                models[name] = await createModel(server, connection, info);
            }
        }
        else if (typeof loadSchemasFrom === 'object') {
            for (const [name, schema] of Object.entries(loadSchemasFrom)) {
                models[name] = connection.model(name.toLowerCase(), schema);
            }
        }

        for (const name of Object.keys(models)) {
            server.log(
                ['info', 'hapi-mongoose2'],
                `registered model '${name}' for database '${connection.name}'`
            );
        }

        const mongo = { models, connection };

        if (connections.length > 1) {
            const name = settings.alias || connection.name;
            mongos[name] = mongo;
        }
        else {
            mongos = mongo;
        }
    }

    return mongos;
};

const register = async function (server, options) {

    const settings = await Joi.attempt(options, Schema.options);
    const { connection, connections, decorations } = settings;

    // Connect and load schemas.

    const mongos = await connect(server, connections || [connection]);

    // Decorations.

    for (const type of decorations) {
        server.decorate(type, 'mongo', mongos);
    }

    server.app.mongo = mongos;
};

module.exports = {
    pkg: require('../package.json'),
    register
};
