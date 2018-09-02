'use strict';

const Joi = require('joi');
const Schema = require('../lib/schema');
const { expect } = require('code');

const lab = exports.lab = require('lab').script();
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

    it('requires uri to be a mongodb schema', async () => {

        const options = {
            connection: {
                uri: 'http://hapijs.com/api'
            }
        };
        await expect(Joi.validate(options, Schema.options)).to.reject(
            'child "connection" fails because [child "uri" fails because ' +
            '["uri" must be a valid uri with a scheme matching the mongodb ' +
            'pattern]]'
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

    it('defaults loadSchemasFrom to empty array', async () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            }
        };
        const result = await Joi.validate(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('loadSchemasFrom');
        expect(result.connection.loadSchemasFrom).to.be.an.array();
        expect(result.connection.loadSchemasFrom).to.be.empty();
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
