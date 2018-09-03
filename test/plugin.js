'use strict';

const HapiMongoose = require('../lib');
const Mongoose = require('mongoose');
const Hapi = require('hapi');
const { expect } = require('code');

const { connected } = Mongoose.STATES;

const lab = exports.lab = require('lab').script();
const { describe, it } = lab;

it('can be registered once', async () => {

    const plugins = [
        {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test'
                }
            }
        },
        {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test-2'
                }
            }
        }
    ];
    const server = Hapi.server();
    await expect(server.register(plugins)).to.reject(
        'Plugin hapi-mongoose2 already registered'
    );
});

describe('connection', () => {

    it('fails to connect to invalid uri', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://invalid:27017/test'
                }
            }
        };
        const server = Hapi.server();
        await expect(server.register(plugin)).to.reject(
            'failed to connect to server [invalid:27017] on first connect ' +
            '[MongoNetworkError: getaddrinfo ENOTFOUND invalid invalid:27017]'
        );
    });

    it('connects to authenticated database', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test-auth',
                    options: {
                        auth: {
                            user: 'user',
                            password: 'password'
                        }
                    }
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);
    });

    it('exposes connection and models', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test'
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');
        expect(server.app.mongo).to.only.include(['connection', 'models']);

        const { connection, models } = server.app.mongo;

        expect(connection.constructor.name).to.equal('NativeConnection');
        expect(connection.host).to.equal('localhost');
        expect(connection.port).to.equal(27017);
        expect(connection.name).to.equal('test');
        expect(connection.readyState).to.equal(connected);

        expect(models).to.be.an.object();
        expect(models).to.be.empty();
    });

    it('adds useNewUrlParser by default on mongooseOptions', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test'
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');

        const { mongo } = server.app;
        expect(mongo).to.include('connection');
        expect(mongo.connection).to.include('_connectionOptions');
        expect(mongo.connection._connectionOptions).to.include({
            useNewUrlParser: true
        });
    });

    it('ignores alias', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    alias: 'test-db',
                    uri: 'mongodb://localhost:27017/test'
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');

        const { mongo } = server.app;
        expect(mongo).to.include('connection');
        expect(mongo.connection.constructor.name).to.equal('NativeConnection');
    });

    it('throws when loading a json file', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: ['test/schemas/empty.json']
                }
            }
        };
        const server = Hapi.server();
        await expect(server.register(plugin)).to.reject(
            'unable to create model for file: empty.json'
        );
    });

    it('throws when loading an invalid function file', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: ['test/schemas/fns/invalid-fn.js']
                }
            }
        };
        const server = Hapi.server();
        await expect(server.register(plugin)).to.reject(
            'unable to create model for file: invalid-fn.js'
        );
    });

    it('loads schema files from patterns and renames keys', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: [
                        'test/**/*.{js,json}',
                        '!test/*.js',
                        '!**/*.json',
                        '!**/invalid-fn.js',
                        '!test/schemas/fns/admin.js'
                    ]
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');
        expect(server.app.mongo).to.include('models');

        const { models } = server.app.mongo;
        expect(models).to.be.an.object();
        expect(models).to.only.include(['Animal', 'Blog']);
    });

    it('loads schema functions from patterns and renames keys', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: ['test/schemas/fns/admin.js']
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');
        expect(server.app.mongo).to.include('models');

        const { models } = server.app.mongo;
        expect(models).to.be.an.object();
        expect(models).to.only.include(['Admin']);
    });

    it('loads all schemas from patterns and renames keys', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: [
                        'test/**/*.{js,json}',
                        '!test/*.js',
                        '!**/*.json',
                        '!**/invalid-fn.js'
                    ]
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');
        expect(server.app.mongo).to.include('models');

        const { models } = server.app.mongo;
        expect(models).to.be.an.object();
        expect(models).to.only.include(['Animal', 'Blog', 'Admin']);
    });

    it('passes server and performs actions on function schemas', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: ['test/schemas/fns/admin.js']
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        const doc = {
            name: 'Quentin',
            last: 'Tarantino'
        };

        server.event('admin-created');
        const adminCreated = new Promise((resolve) => {

            server.events.on('admin-created', (obj) => {

                expect(obj).to.contain(doc);
                resolve();
            });
        });

        const { Admin } = server.app.mongo.models;
        const admin = await Admin.create(doc);
        await adminCreated;
        await admin.remove();
    });

    it('creates server decoration', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test'
                },
                decorations: ['server']
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server).to.include('mongo');
        expect(server.mongo).to.only.include(['connection', 'models']);
    });

    it('creates request decoration', async () => {

        const plugins = [
            {
                plugin: HapiMongoose,
                options: {
                    connection: {
                        uri: 'mongodb://localhost:27017/test'
                    },
                    decorations: ['server']
                }
            },
            {
                register: (server) => {

                    server.route({
                        method: 'GET',
                        path: '/',
                        handler: (request, h) => {

                            expect(request).to.include('mongo');
                            expect(request.mongo).to.only.include([
                                'connection',
                                'models'
                            ]);
                            return h.continue;
                        }
                    });
                },
                name: 'test'
            }
        ];
        const server = Hapi.server();
        await server.register(plugins);

        await server.inject({ method: 'GET', url: '/' });
    });

    it('creates a document using a model', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connection: {
                    uri: 'mongodb://localhost:27017/test',
                    loadSchemasFrom: [
                        'test/**/*.{js,json}',
                        '!test/*.js',
                        '!**/*.json',
                        '!**/invalid-fn.js'
                    ]
                }
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        const fields = {
            name: 'Dodi',
            type: 'dog'
        };
        const { Animal } = server.app.mongo.models;
        await Animal.create(fields);

        const animal = await Animal.findOne({ name: 'Dodi' });
        expect(animal).to.exist();
        expect(animal.toObject()).to.include(fields);
        await animal.remove();
    });
});

describe('connections', () => {

    it('exposes connections and connections models', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connections: [
                    {
                        uri: 'mongodb://localhost:27017/test-1'
                    },
                    {
                        uri: 'mongodb://localhost:27017/test-2'
                    }
                ]
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');

        const mongos = server.app.mongo;
        expect(server.app.mongo).to.only.include(['test-1', 'test-2']);

        for (const [key, mongo] of Object.entries(mongos)) {
            expect(mongo).to.only.include(['connection', 'models']);

            const { connection, models } = mongo;
            expect(connection.constructor.name).to.equal('NativeConnection');
            expect(connection.host).to.equal('localhost');
            expect(connection.port).to.equal(27017);
            expect(connection.name).to.equal(key);
            expect(connection.readyState).to.equal(connected);
            expect(models).to.be.an.object();
            expect(models).to.be.empty();
        }
    });

    it('uses alias for a connection', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connections: [
                    {
                        alias: 'test-db',
                        uri: 'mongodb://localhost:27017/test-1'
                    },
                    {
                        uri: 'mongodb://localhost:27017/test-2'
                    }
                ]
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');
        expect(server.app.mongo).to.only.include(['test-db', 'test-2']);

        const conn1 = server.app.mongo['test-db'].connection;
        expect(conn1.name).to.equal('test-1');

        const conn2 = server.app.mongo['test-2'].connection;
        expect(conn2.name).to.equal('test-2');
    });

    it('loads schemas for different connections', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connections: [
                    {
                        uri: 'mongodb://localhost:27017/test-1',
                        loadSchemasFrom: ['test/**/animal.js']
                    },
                    {
                        uri: 'mongodb://localhost:27017/test-2',
                        loadSchemasFrom: ['test/**/blog.js']
                    }
                ]
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server.app).to.include('mongo');

        const { mongo } = server.app;
        expect(mongo).to.only.include(['test-1', 'test-2']);
        expect(mongo['test-1'].models).to.be.an.object();
        expect(mongo['test-1'].models).to.only.include('Animal');
        expect(mongo['test-2'].models).to.be.an.object();
        expect(mongo['test-2'].models).to.only.include('Blog');
    });

    it('creates server decoration for all connections', async () => {

        const plugin = {
            plugin: HapiMongoose,
            options: {
                connections: [
                    {
                        uri: 'mongodb://localhost:27017/test-1'
                    },
                    {
                        uri: 'mongodb://localhost:27017/test-2'
                    }
                ],
                decorations: ['server']
            }
        };
        const server = Hapi.server();
        await server.register(plugin);

        expect(server).to.include('mongo');

        const { mongo } = server;
        expect(mongo).to.include(['test-1', 'test-2']);
        expect(mongo['test-1']).to.only.include(['connection', 'models']);
        expect(mongo['test-2']).to.only.include(['connection', 'models']);
    });

    it('creates request decoration for all connections', async () => {

        const plugins = [
            {
                plugin: HapiMongoose,
                options: {
                    connections: [
                        {
                            uri: 'mongodb://localhost:27017/test-1'
                        },
                        {
                            uri: 'mongodb://localhost:27017/test-2'
                        }
                    ],
                    decorations: ['server']
                }
            },
            {
                register: (server) => {

                    server.route({
                        method: 'GET',
                        path: '/test-1',
                        handler: (request, h) => {

                            expect(request).to.include('mongo');

                            const { mongo } = request;
                            expect(mongo).to.include('test-1');
                            expect(mongo['test-1']).to.only.include([
                                'connection',
                                'models'
                            ]);
                            return h.continue;
                        }
                    });
                },
                name: 'test-1'
            },
            {
                register: (server) => {

                    server.route({
                        method: 'GET',
                        path: '/test-2',
                        handler: (request, h) => {

                            expect(request).to.include('mongo');

                            const { mongo } = request;
                            expect(mongo).to.include('test-2');
                            expect(mongo['test-2']).to.only.include([
                                'connection',
                                'models'
                            ]);
                            return h.continue;
                        }
                    });
                },
                name: 'test-2'
            }
        ];
        const server = Hapi.server();
        await server.register(plugins);

        await server.inject({ method: 'GET', url: '/test-1' });
        await server.inject({ method: 'GET', url: '/test-2' });
    });
});
