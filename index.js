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

PhotoClient.prototype.getToken = function(callback) {
  var tokenUrl = this.config.endpoint + apiPaths.token;
  request.post(tokenUrl, { form: { "AccountName": this.config.username, "Password": this.config.password }}, function(err, response, body) {
    if (err) { return console.log(err); }
    callback(JSON.parse(body))
  });
}


PhotoClient.prototype.getPhoto = function(ids, batch) {
  return false
}

module.exports = PhotoClient;