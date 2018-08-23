'use strict';

const Hapi = require('hapi');
const HapiMongoose = require('../lib');

const plugin = {
    plugin: HapiMongoose,
    options: {
        connections: [
            {
                uri: 'mongodb://localhost:27017/myapp'
            },
            {
                alias: 'safebox',
                uri: 'mongodb://localhost:27017/secrets',
                schemaPatterns: [
                    'src/schemas/**/*.js',
                    '!*.{md,json}'
                ],
                options: {
                    auth: {
                        user: 'admin',
                        password: 'pa55w0rd'
                    },
                    autoIndex: false,
                    bufferCommands: true
                }
            }
        ]
    }
};

const server = new Hapi.server();
server.register(plugin);
