const redis = require('redis');
const extend = require('extend');

function CacheStore(options) {
  const config = {
    redisHost: 'localhost',
    redisPort: 6379,
    redisDatabase: 0,
    redisOptions: {
      detect_buffers: true,
    },
    photoExpiry: 3600,
    tokenExpiry: 86400,
    photoPrefix: 'photo:',
    tokenKey: 'token',
  };
  extend(config, options);

  const client = redis.createClient(
    config.redisPort,
    config.redisHost,
    config.redisOptions
  );
  if (config.password) {
    client.auth(config.password);
  }
  if (config.redisDatabase !== 0) {
    client.select(config.redisDatabase);
  }
  this.client = client;
  this.config = config;
}

CacheStore.prototype.getPhotos = function(ids) {
  const prefix = this.config.photoPrefix;
  const keys = ids.map(function(id) {
    return prefix + id;
  });
  return new Promise((resolve, reject) => {
    this.client.mget(keys, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

CacheStore.prototype.setPhotos = function(photos) {
  const multi = this.client.multi();
  const prefix = this.config.photoPrefix;
  const expiry = this.config.photoExpiry;
  photos.forEach(function(photo) {
    multi.setex(prefix + photo.SfuId, expiry, JSON.stringify(photo));
  });
  return new Promise((resolve, reject) => {
    multi.exec(function(err, replies) {
      if (err) {
        reject(err);
      } else {
        resolve(replies);
      }
    });
  });
};

CacheStore.prototype.getToken = function() {
  return new Promise((resolve, reject) => {
    this.client.get(this.config.tokenKey, function(err, token) {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

CacheStore.prototype.setToken = function(token) {
  return new Promise((resolve, reject) => {
    this.client.setex(
      this.config.tokenKey,
      this.config.tokenExpiry,
      token,
      function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

CacheStore.prototype.flushToken = function() {
  return new Promise((resolve, reject) => {
    this.client.del(this.config.tokenKey, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

CacheStore.prototype.flushPhotos = function() {
  return new Promise((resolve, reject) => {
    this.client.keys(this.config.photoPrefix + '*', function(err, results) {
      const multi = this.client.multi();
      results.forEach(function(key) {
        multi.del(key);
      });
      multi.exec(function(err, responses) {
        if (err) {
          reject(err);
        } else {
          resolve(responses);
        }
      });
    });
  });
};

CacheStore.prototype.flushAll = function() {
  return new Promise((resolve, reject) => {
    this.client.flushall(function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

module.exports = CacheStore;
