'use strict';

var extend = require('extend');
var rp = require('request-promise');

var apiPaths = {
  token: '/Account/Token',
  photo: '/Values'
};

function PhotoClient (options) {
  var config = {
    cache: {
      redisUrl: "redis://localhost:6379",
      redisOptions: {
        detect_buffers: true
      },
      photoCacheLifetime: 3600,
    }
  };
  extend(config, options);

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

  this.config = config;
}

PhotoClient.prototype.getToken = function() {
  var options = {
    uri: this.config.endpoint + apiPaths.token,
    method: 'POST',
    form: {
      'AccountName': this.config.username,
      'Password': this.config.password
    }
  };
  return rp(options).then(function(token) { return JSON.parse(token); });
}


PhotoClient.prototype.getPhoto = function(ids, batch) {
  return false
}

module.exports = PhotoClient;