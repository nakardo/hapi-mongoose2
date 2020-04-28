# hapi-mongoose2

[![npm version](https://badge.fury.io/js/hapi-mongoose2.svg)](https://badge.fury.io/js/hapi-mongoose2)
[![Greenkeeper badge](https://badges.greenkeeper.io/nakardo/hapi-mongoose2.svg)](https://greenkeeper.io/)
[![CircleCI](https://circleci.com/gh/nakardo/hapi-mongoose2.svg?style=svg)](https://circleci.com/gh/nakardo/hapi-mongoose2)

Mongoose plugin for hapi-based servers. Supports connecting to one or multiple databases and look up and register models by connection. The plugin options are:

- `options` - a `connection` or an array of `connection`s where:
  - `connection` - an object containing:
    - `uri` - a mongo uri string
    - `alias` - (optional) a database name alias used to namespace connections when multiple are created. otherwise ignored.
    - `loadSchemasFrom` - (optional) one of:
       - An array of [globs](https://github.com/isaacs/minimatch#usage) from where schemas will be loaded. matching files must export a `mongoose.Schema` object or a function with the signature `async function(server)` returning a schema.
       - An object containing `Mongoose.Schema` elements.
    - `options` - (optional) options passed to `mongoose` [createConnection](https://mongoosejs.com/docs/connections.html#options) method. unknown properties are allowed:
      - `auth` - an object with auth credentials
        - `user`
        - `password`
      - `autoIndex`
      - `bufferCommands`
  - `connections` - an array of `connection` objects as described above.
  - `decorations` - (optional) an array of [interfaces](https://hapijs.com/api#-serverdecoratetype-property-method-options) to be decorated using `server.decorate` method. allowed values are `server`, `request`.

Connection and models are accessible under the `server.app.mongo` property. When multiple connections are created the database name or `alias` is used as namespace for accessing each database properties. Same applies for decorated interfaces.

Models are named as the filename matching the schema pattern. Model name first letter is capitalized by default. e.g. `Animal`.

## Example

```javascript
const plugin = {
    plugin: require('hapi-mongoose2'),
    options: {
        connections: [
            {
                uri: 'mongodb://localhost:27017/myapp'
            },
            {
                alias: 'safebox',
                uri: 'mongodb://localhost:27017/secrets',
                loadSchemasFrom: [
                    'src/schemas',
                    '!.{md,json}'
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
        ],
        decorations: ['request', 'server']
    }
};

const server = new Hapi.server();
await server.register(plugin);

// Using database `secrets` from:
// 1 - `server.app` object
// 2 - `request` decorated object
// 3 - `server` decorated object

const { Admin } = server.app.mongo.safebox.models;
await Admin.create({ name: 'Quentin', last: 'Tarantino' });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request) {
        const { Admin } = request.mongo.safebox.models;
        return Admin.findOne({ name: 'Quentin' }).exec();
    }
});

await server.mongo.safebox.connection.close();
```
