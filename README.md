# node-sfu-photos-client

`node-sfu-photos-client` is a module to interface with the SFU ID Photos API.

## Access

Access to the SFU Photos API requires a username and password. Contact Danny Louie \<danny_louie@sfu.ca\> for access.

## Installation

```
npm install "git+https://github.com/sfu/node-sfu-photos-client.git"  --save
```

## Usage

```
// require the module in your application
var PhotoClient = require('node-sfu-photos-client');

// create a new instance of the client
var client = new PhotoClient({
    username: "photoapiuser",
    password: "supersecretpassword",
    cache: {
        redisUrl: "redis://localhost:6379",
        redisOptions: {},
        photoCacheLifetime: 3600,
        tokenCacheLifetime: 86400
    }
});

// retrieve the photo for a single SFU ID
var photo = client.getPhoto("123456789");

// retrieve the photo for multiple SFU IDs
// note that your auth token will determine how many photos you can retreive in one call

var photos = client.getPhoto(["123456789", "987654321"]);
```

## Caching

Photos can be cached in redis to help alleviate load on the Photo API server. The default is to cache a photo for one hour (3600 seconds). You can configure this with `cache.photoCacheLifetime` option in the PhotoClient initialization.

If you don't want to use a redis cache, set `cahce` to `false` in the initialization.

If caching is enabled, the authentication token will also be cached. It is recommended to cache the token for a duration _less_ than its actual lifetime. For example, if your token is good for one hour, you may want to cache the token for 55 minutes. Tokens are stored in an expiring key in redis.

