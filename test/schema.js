'use strict';

const Joi = require('@hapi/joi');
const Schema = require('../lib/schema');
const { expect } = require('@hapi/code');

const lab = exports.lab = require('@hapi/lab').script();
const { describe, it } = lab;

describe('Schema.options', () => {

    it('requires connection or connections option', () => {

        expect(() => Joi.attempt({}, Schema.options)).to.throw(
            '"value" must contain at least one of [connection, connections]'
        );
    });

    it('requires a uri for connection', () => {

        const options = {
            connection: {}
        };
        expect(() => Joi.attempt(options, Schema.options)).to.throw(
            '"connection.uri" is required'
        );
    });

    it('creates a connection', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            }
        };
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('uri');
        expect(result.connection.uri).to.equal(options.connection.uri);
    });

    it('creates connection with an alias and trims value', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                alias: 'test-db '
            }
        };
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('alias');
        expect(result.connection.alias).to.equal(
            options.connection.alias.trim()
        );
    });

    it('creates connection with loadSchemasFrom', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                loadSchemasFrom: ['test/schemas/*']
            }
        };
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.include('loadSchemasFrom');
        expect(result.connection.loadSchemasFrom).to.be.an.array();
        expect(result.connection.loadSchemasFrom).to.equal(
            options.connection.loadSchemasFrom
        );
    });

    it('creates connection with decorations', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            },
            decorations: ['server', 'request']
        };
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('decorations');
        expect(result.decorations).to.be.an.array();
        expect(result.decorations).to.equal(options.decorations);
    });

    it('expect decorations to be known values', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test'
            },
            decorations: ['handler', 'toolkit']
        };
        expect(() => Joi.attempt(options, Schema.options)).to.throw(
            '"decorations[0]" must be one of [server, request]'
        );
    });

    it('creates connection with mongooseOptions', () => {

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
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.not.include('options');
        expect(result.connection).to.include('mongooseOptions');
        expect(result.connection.mongooseOptions).to.be.an.object();
        expect(result.connection.mongooseOptions).to.include(
            options.connection.options
        );
    });

    it('doesn\'t strip unknown keys on mongooseOptions', () => {

        const options = {
            connection: {
                uri: 'mongodb://localhost:27017/test',
                options: {
                    autoIndex: false
                }
            }
        };
        const result = Joi.attempt(options, Schema.options);
        expect(result).to.include('connection');
        expect(result.connection).to.be.an.object();
        expect(result.connection).to.not.include('options');
        expect(result.connection).to.include('mongooseOptions');
        expect(result.connection.mongooseOptions).to.be.an.object();
        expect(result.connection.mongooseOptions).to.include(
            options.connection.options
        );
    });

    it('disallows setting both connection and connections', () => {

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
        expect(() => Joi.attempt(options, Schema.options)).to.throw(
            '"value" contains a conflict between exclusive peers ' +
            '[connection, connections]'
        );
    });

    it('expect connections to be an array of connection objects', () => {

        const connection = Schema.connection.describe();
        expect(connection).to.include('metas');
        expect(connection.metas).to.include('connection');

        const { connections } = Schema.options.describe().keys;
        expect(connections.type).to.equal('array');

        const item = connections.items[0];
        expect(item).to.include('metas');
        expect(item.metas).to.include('connection');
    });
});
