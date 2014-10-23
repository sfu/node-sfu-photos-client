var redis = require('redis');
var extend = require('extend');


function CacheStore(options) {
  var config = {
    redisHost: "localhost",
    redisPort: 6379,
    redisDatabase: 0,
    redisOptions: {
      detect_buffers: true
    },
    photoExpiry: 3600,
    tokenExpiry: 86400,
    photoPrefix: 'photo:',
    tokenKey: 'token'
  };
  extend(config, options);

  var client = redis.createClient(config.redisPort, config.redisHost, config.redisOptions);
  if (config.password) {
    client.auth(config.password);
  }
  if (config.redisDatabase !== 0) {
    client.select(config.redisDatabase);
  }
  this.client = client;
  this.config = config;
};

CacheStore.prototype.getPhotos = function(ids, cb) {
  this.client.mget(ids, function(err, result) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, result);
    }
  });
};

CacheStore.prototype.setPhotos = function(photos, cb) {
  var multi = this.client.multi();
  var prefix = this.config.photoPrefix;
  var expiry = this.config.photoExpiry;
  photos.forEach(function(photo) {
    multi.setex(prefix + photo.SfuId, expiry, JSON.stringify(photo));
  });
  multi.exec(function(err, replies) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, replies);
    }
  });
};

CacheStore.prototype.getToken = function(cb) {
  this.client.get(this.config.tokenKey, function(err, token) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, token);
    }
  });
};

CacheStore.prototype.setToken = function(token, cb) {
  this.client.setex(this.config.tokenKey, this.config.tokenExpiry, token, function(err, result) {
    if (cb) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, result);
      }
    }
  });
};

CacheStore.prototype.flush = function(cb) {
  this.client.flushall(function(err, response) {
    cb();
  });
};

module.exports = CacheStore;