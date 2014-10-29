var redis = require('redis');
var extend = require('extend');
var Q = require('q');

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

CacheStore.prototype.getPhotos = function(ids) {
  var deferred = Q.defer();
  var prefix = this.config.photoPrefix;
  var keys = ids.map(function(id) {
    return prefix + id;
  });
  this.client.mget(keys, function(err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};

CacheStore.prototype.setPhotos = function(photos) {
  var deferred = Q.defer();
  var multi = this.client.multi();
  var prefix = this.config.photoPrefix;
  var expiry = this.config.photoExpiry;
  photos.forEach(function(photo) {
    multi.setex(prefix + photo.SfuId, expiry, JSON.stringify(photo));
  });
  multi.exec(function(err, replies) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(replies);
    }
  });
  return deferred.promise;
};

CacheStore.prototype.getToken = function() {
  var deferred = Q.defer();
  this.client.get(this.config.tokenKey, function(err, token) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(token);
    }
  });
  return deferred.promise;
};

CacheStore.prototype.setToken = function(token) {
  var deferred = Q.defer();
  this.client.setex(this.config.tokenKey, this.config.tokenExpiry, token, function(err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};

CacheStore.prototype.flushToken = function() {
  var deferred = Q.defer();
  this.client.del(this.config.tokenKey, function(err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });
  return deferred.promise;
}

CacheStore.prototype.flushPhotos = function() {
  var deferred = Q.defer();
  var self = this;
  this.client.keys(this.config.photoPrefix + '*', function(err, results) {
    var multi = self.client.multi();
    results.forEach(function(key) {
      multi.del(key);
    });
    multi.exec(function(err, responses) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(responses);
      }
    });
  });
  return deferred.promise;
};

CacheStore.prototype.flushAll = function() {
  var deferred = Q.defer();
  this.client.flushall(function(err, response) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(response);
    }
  });
  return deferred.promise;
};

module.exports = CacheStore;