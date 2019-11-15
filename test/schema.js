'use strict';

const Joi = require('@hapi/joi');
const Schema = require('../lib/schema');
const { expect } = require('@hapi/code');

const lab = exports.lab = require('@hapi/lab').script();
const { describe, it } = lab;

describe('Schema.options', () => {

    it('requires connection or connections option', async () => {

        await expect(Joi.validate({}, Schema.options)).to.reject(
            '"value" must contain at least one of [connection, connections]'
        );
    });

    it('requires a uri for connection', async () => {

        const options = {
            connection: {}
        };
        await expect(Joi.validate(options, Schema.options)).to.reject(
            'child "connection" fails because [child "uri" fails because ' +
            '["uri" is required]]'
        );
    });

    it('creates a connection', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('uri');
        expect(result.connection.uri).to.equal(options.connection.uri);
    });

    it('creates connection with an alias and trims value', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                alias: 'test-db '
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('alias');
        expect(result.connection.alias).to.equal(
            options.connection.alias.trim()
        );
    });

    it('creates connection with loadSchemasFrom', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                loadSchemasFrom: ['test/schemas/*']
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('loadSchemasFrom');
        expect(result.connection.loadSchemasFrom).to.be.an.array();
        expect(result.connection.loadSchemasFrom).to.equal(
            options.connection.loadSchemasFrom
        );
    });

    it('creates connection with decorations', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            },
            decorations: ['server', 'request']
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('decorations');
        expect(result.decorations).to.be.an.array();
        expect(result.decorations).to.equal(options.decorations);
    });

    it('expect decorations to be known values', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            },
            decorations: ['handler', 'toolkit']
        };
        await expect(Joi.validate(options, Schema.options)).to.reject(
            'child \"decorations\" fails because [\"decorations\" at ' +
            'position 0 fails because [\"0\" must be one of [server, ' +
            'request]]]'
        );
    });

    it('creates connection with mongooseOptions', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                options: {
                    auth: {
                        user: 'admin',
                        password: 'admin'
                    },
                    autoIndex: false,
                    bufferCommands: false
                }
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.not.include('options');
        expect(result.connection).to.include('mongooseOptions');
        expect(result.connection.mongooseOptions).to.be.an.object();
        expect(result.connection.mongooseOptions).to.include(
            options.connection.options
        );
    });

    it('doesn\'t strip unknown keys on mongooseOptions', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                options: {
                    autoIndex: false
                }
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.not.include('options');
        expect(result.connection).to.include('mongooseOptions');
        expect(result.connection.mongooseOptions).to.be.an.object();
        expect(result.connection.mongooseOptions).to.include(
            options.connection.options
        );
    });

    it('disallows setting both connection and connections', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            },
            connections: [
                {
                    uri: 'mongodb://localhost:27017/test-2'
                }
            ]
        };
        await expect(Joi.validate(options, Schema.options)).to.reject(
            '"value" contains a conflict between exclusive peers ' +
            '[connection, connections]'
        );
    });

    it('expect connections to be an array of connection objects', () => {

        const connection = Joi.describe(Schema.connection);
        expect(connection).to.include('meta');
        expect(connection.meta).to.include('connection');

        const { connections } = Joi.describe(Schema.options).children;
        expect(connections.type).to.equal('array');

        const item = connections.items[0];
        expect(item).to.include('meta');
        expect(item.meta).to.include('connection');
    });
});
