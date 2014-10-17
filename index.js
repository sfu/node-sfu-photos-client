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


PhotoClient.prototype.getPhoto = function(ids, cb) {
  if (!Array.isArray(ids)) {
    ids.toString().split(',');
  }
  var photosToFetch = ids.length;
  var self = this;

  var returnedPhotos = {};
  var idsToFetch = ids.map(function(x) { return x; });
  var cacheIds = ids.map(function(id) { return self.config.cache.photoPrefix + id; });

  function done() {
    var arr = ids.map(function(id) {
      return returnedPhotos[id];
    });
    cb(null, arr);
  }

  self.photoCache.mget(cacheIds, function(err, results) {
    if (err) {
      // TODO handle error
    } else {
      // results is an array that will have null values where there was no data in the cache
      // if we got back a cached photo we should remove the entry from the ids array and push the result into returnedPhotos
      results.forEach(function(photo) {
        if (photo) {
          photo = JSON.parse(photo);
          var idsPos = ids.indexOf(photo.SfuId);
          returnedPhotos[photo.SfuId] = photo;
          idsToFetch.splice(idsPos, 1);  
        }
      });
      // now idsToFetch contains only the ids of photos we need to fecth from the api
      // we can fetch in bulk
      // TODO we need to handle having more photos to fecth than what the token allows
      if (idsToFetch.length) {
        var options = {
          uri: self.config.endpoint + apiPaths.photo + '/' + idsToFetch.join(','),
          method: 'GET',
        }
        self.getToken(function(err, token) {
          // TODO handle error case
          options.headers = {
            'Authorization': 'Bearer ' + token
          };
          request(options, function(err, response, body) {
            if (err) {
              cb(err);
            } else {
              var photoData = JSON.parse(body);
              var multi = self.photoCache.multi();
              photoData.forEach(function(photo) {
                var idsPos = ids.indexOf(photo.SfuId);
                returnedPhotos[photo.SfuId] = photo;
                multi.setex(self.config.cache.photoPrefix + photo.SfuId, self.config.cache.photoExpiry, JSON.stringify(photo));
              });
              multi.exec(function(err, replies) {
                if (err) {
                  cb(err);
                } else {
                  done();
                }
              });
            }
          })
        });
      } else {
        done();
      }
      
    }
  });
}

PhotoClient.prototype.flushCache = function(type) {
  var self = this;
  function flushTokenCache() {
    self.tokenCache.del(self.config.cache.tokenKey, function(err, results) {});
  }

  function flushPhotoCache() {
    self.photoCache.keys(self.config.cache.photoPrefix + '*', function(err, results) {
      results.forEach(function(key) {
        self.photoCache.del(key, function(err, results) {});
      })
    });
  }

  switch(type) {
    case 'token':
    flushTokenCache();
    break;

    case 'photo':
    flushPhotoCache();
    break;

    default:
    flushTokenCache();
    flushPhotoCache();
    break;

  }
}

module.exports = PhotoClient;