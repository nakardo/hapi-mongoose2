# hapi-mongoose2

[![npm version](https://badge.fury.io/js/hapi-mongoose2.svg)](https://badge.fury.io/js/hapi-mongoose2)
[![CircleCI](https://circleci.com/gh/nakardo/hapi-mongoose2.svg?style=svg)](https://circleci.com/gh/nakardo/hapi-mongoose2)

Mongoose plugin for hapi-based servers. Supports connecting to one or multiple
databases and look up and register models by connection. Additionally
aliases can be created to reference connections. The plugin options are:

- `options` - a `connection` or an array of `connection`s where:
  - `connection` - an object containing:
    - `uri` - a mongo uri
    - `alias` - (optional) a database name alias which is only used to reference the connection when multiple are created. otherwise ignored.
    - `schemaPatterns` - (optional) an array of [globs](https://github.com/isaacs/minimatch#usage) where schemas can be found. matching files musr export a `mongoose.Schema` object or a function with the signature `async function(server)` that returns a schema.
    - `options` - (optional) options passed to `mongoose` [createConnection](https://mongoosejs.com/docs/connections.html#options) method. unknown properties are allowed:
      - `auth` - authentication credentials
        - `user`
        - `password`
      - `autoIndex`
      - `bufferCommands`
  - `connections` - an array of `connection` objects as described above.

Connection and models are accessible under the `server.app.mongo` property. When multiple connections are created the database name or `alias` is used as namespace for accessing each database properties.

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
                schemaPatterns: [
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
        ]
    }
};

const server = new Hapi.server();
await server.register(plugin);

// Using database `secrets`:

const { Admin } = server.app.mongo.safebox.models;
await Admin.create({ name: 'Quentin', last: 'Tarantino' });
await server.app.mongo.safebox.connection.close();
```

## Dependencies

```
"mongoose": ">=5.0.0",
"hapi": ">=17.0.0"
```
