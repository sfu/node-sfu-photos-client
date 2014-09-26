'use strict';

var extend = require('extend');

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
  if (!config.username) {
    throw new Error('Photos API username is required');
  }

  if (!config.password) {
    throw new Error('Photos API password is required');
  }

  this.config = config;
}

PhotoClient.prototype.getPhoto = function(ids) {
  return false
}

module.exports = PhotoClient;