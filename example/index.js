'use strict';

const Hapi = require('hapi');
const HapiMongoose = require('../lib');

const plugin = {
    plugin: HapiMongoose,
    options: {
        connection: {
            uri: 'mongodb://localhost:27017/test',
            schemaPatterns: [
                'test/schemas',
                '!**/*.json'
            ],
            options: {
                autoIndex: false,
                bufferCommands: true
            }
        }
    }
};

(async () => {

    const server = new Hapi.server({ debug: { log: '*' } });
    await server.register(plugin);
})();
