'use strict';

var extend = require('extend');
var request = require('request');
var redis = require('redis');

var apiPaths = {
  token: '/Account/Token',
  photo: '/Values'
};

function PhotoClient (options) {
  var config = {
    cache: {
      redisHost: "localhost",
      redisPort: 6379,
      redisOptions: {
        detect_buffers: true
      },
      photoExpiry: 3600,
      tokenExpiry: 86400,
      photoPrefix: 'photo:',
      tokenKey: 'token'
    }
  };
  extend(config, options);
  this.config = config;

  // throw if any required options are missing
  if (!config.endpoint) {
    throw new Error('Photos API endpoint is required')
  }
  if (!config.username) {
    throw new Error('Photos API username is required');
  }
  if (!config.password) {
    throw new Error('Photos API password is required');
  }

  // set up redis connection
  this.tokenCache = redis.createClient(config.cache.redisPort, config.cache.redisHost, config.cache.redisOptions);
  this.photoCache = redis.createClient(config.cache.redisPort, config.cache.redisHost, config.cache.redisOptions);
}

PhotoClient.prototype.getToken = function(cb) {
  var options = {
    uri: this.config.endpoint + apiPaths.token,
    method: 'POST',
    form: {
      'AccountName': this.config.username,
      'Password': this.config.password
    }
  };
  
  var self = this;
  self.tokenCache.get(self.config.cache.tokenKey, function(err, token) {
    if (err || !token) {
      request(options, function(err, response, body) {
        if (err) {
          cb(err);
        } else {
          var token = JSON.parse(body)['ServiceToken'];
          self.tokenCache.setex(self.config.cache.tokenKey, self.config.cache.tokenExpiry, token);
          cb(null, token);
        }
      });
    } else {
      cb(null, token);
    }
  });
}


PhotoClient.prototype.getPhoto = function(id, cb) {
  return false;
}

module.exports = PhotoClient;