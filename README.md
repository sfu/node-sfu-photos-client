# node-sfu-photos-client

`node-sfu-photos-client` is a module to interface with the SFU ID Photos API.

## Access

Access to the SFU Photos API requires a username and password. Contact Danny Louie \<danny_louie@sfu.ca\> for access.

## Installation

```
npm install "git+https://github.com/sfu/node-sfu-photos-client.git"  --save
```

## Tests

To run tests: `npm test`

Tests require:

* a ./test/config.json file
* fixture data:
  * 1user.json
  * 2users.json
  * 10users.json
  * 11users.json

Fixture data is not checked into the project because it contains personal information. The JSON files are simply the result of calling the API for `x` users (1, 2, 10 or 11).

## Usage

`node-sfu-photos-client` provides both a node-style (`err, results`) callback interface, as well as a promise interface (using [Q](http://documentup.com/kriskowal/q/)).

### Callback-style interface

```
// require the module in your application
var PhotoClient = require('node-sfu-photos-client');

// create a new instance of the client
var client = new PhotoClient({
    username: "photoapiuser",
    password: "supersecretpassword",
    endpoint: "https://photos-api-server",
    maxPhotosPerRequest: 10
});

// retrieve the photo for a single SFU ID
client.getPhoto(["123456789"], function(err, photo) {
    console.log(photo);
});

// retrieve the photos for multiple SFU IDs
client.getPhoto(["123456789", "987654321"], function(err, photos) {
    console.log(photos);
});
```

### Promise-style interface
```
// require the module in your application
var PhotoClient = require('node-sfu-photos-client');

// create a new instance of the client
var client = new PhotoClient({
    username: "photoapiuser",
    password: "supersecretpassword",
    endpoint: "https://photos-api-server",
    maxPhotosPerRequest: 10
});

// retrieve the photo for a single SFU ID
client.getPhoto(["123456789"]).then(function(photos) {
    console.log(photos);
});

// retrieve the photos for multiple SFU IDs
client.getPhoto(["123456789", "987654321"]).then(function(photos) {
    console.log(photos);
});
```


## Configuration Options

Client configuration is handled by a configuration object passed when initializing a new PhotoClient. See `config.json.example` for a sample configuration.

### Required Options

* `username`: your username for the SFU Photos API
* `password`: your password for the SFU Photos API
* `endpoint`: the base URL for the SFU Photos API
* `maxPhotosPerRequest`: Photos API tokens are limited to a certain number of photos per GET request. This number will be provided to you when you are granted access to the API.

## Caching

Photos can be cached to help alleviate load on the Photo API server. By default, no caching is performed.

A redis caching library is included with this module. To use redis caching, include the following in your configuration (see `config.json.example` for a full configuration):

```
"cache": {
    "store": "redis",
    "options": {
        // redis options
    }
}
````
By default, the following options are used. They can all be overridden, and additional `node-redis` connection options included in `redisOptions`:

```
    "options": {
        "redisHost": "localhost",
        "redisPort": 6379,
        "redisDatabase": 0,
        "redisOptions": {
          "detect_buffers": true
        },
        "photoExpiry": 3600,
        "tokenExpiry": 86400,
        "photoPrefix": "photo:",
        "tokenKey": "token"
    }
}
```

If a redis password is required, specify it with `redisPassword: "password"`.

If caching is enabled, the authentication token will also be cached. It is recommended to cache the token for a duration _less_ than its actual lifetime. For example, if your token is good for one hour, you may want to cache the token for 55 minutes. The redis cache store uses expiring keys (SETEX) for both tokens and photos.

### Implementing alternative cache stores

You can implement and use alternative cache stores. For example, a fictional MongoDB store:

```
var config = {
    cache: {
        store: require('mongo-cache-store'),
        options: { /* cache-specific options... */ }
    }
}
var client = new PhotoClient(config);
```

Cache stores return promises (using [Q](http://documentup.com/kriskowal/q/)) from their public APIs.

All schemes must implement the following public APIs:

#### CacheStore#getPhotos(ids)

Retreive one or more photos from the cache.

* `ids`: an array of SFU IDs

#### CacheStore#setPhotos(photos)

Store one or more photos in the cache.

* `photos`: an array of photo data to cache

#### CacheStore#getToken(callback)

Retrieve the authentication token from the cache.

#### CacheStore#setToken(token)

Store the authentication token in the cache.

* `token`: the auth token

#### CacheStore#flush()

Remove all entries from the cache

Refer to `cache_stores/redis.js` for an example.
