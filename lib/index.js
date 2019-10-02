'use strict';

var extend = require('extend');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var internals = require('./internals');

function PhotoClient(options) {
  var config = {
    cache: {
      store: 'none',
      options: {},
    },
  };
  extend(config, options);
  this.config = config;
  // throw if any required options are missing
  if (!config.endpoint) {
    throw new Error('Photos API endpoint is required');
  }
  if (!config.username) {
    throw new Error('Photos API username is required');
  }
  if (!config.password) {
    throw new Error('Photos API password is required');
  }
  if (!config.maxPhotosPerRequest) {
    throw new Error('"maxPhotosPerRequest" value is required');
  }

  var CacheStore;
  if (typeof config.cache.store === 'function') {
    CacheStore = config.cache.store;
  } else if (
    typeof config.cache.store === 'string' &&
    fs.existsSync(
      path.resolve(__dirname, '..', 'cache_stores', config.cache.store + '.js')
    )
  ) {
    CacheStore = require('../cache_stores/' + config.cache.store);
  } else {
    throw new Error(
      'Invalid cache store specified: ' + config.cache.store.toString()
    );
  }
  this.cache = new CacheStore(config.cache.options);
}

PhotoClient.prototype.getToken = function(cb) {
  var deferred = Q.defer();
  var self = this;

  self.cache
    .getToken()
    .then(function(token) {
      if (!token) {
        internals.fetchTokenFromApi
          .call(self)
          .then(function(token) {
            deferred.resolve(token);
          })
          .fail(function(err) {
            deferred.reject(err);
          });
      } else {
        deferred.resolve(token);
      }
    })
    .fail(function(err) {
      deferred.reject(err);
    });
  return deferred.promise.nodeify(cb);
};

PhotoClient.prototype.getPhoto = function(ids, cb) {
  var deferred = Q.defer();
  if (!Array.isArray(ids)) {
    ids = ids.toString().split(',');
  }
  var photosToFetch = ids.length;
  var self = this;

  var returnedPhotos = {};
  var idsToFetch = ids.map(function(x) {
    return x;
  });

  self.cache
    .getPhotos(ids)
    .then(function(results) {
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
    })
    .then(function() {
      // api tokens are limited to a set number of photos per GET request
      // break the idsToFetchArray into chunks of ids no more than the maxPhotosPerRequest value
      // and make GET requests in parallel
      var chunks = [],
        promises = [];
      var maxPhotosPerRequest = self.config.maxPhotosPerRequest;
      for (var i = 0, j = idsToFetch.length; i < j; i += maxPhotosPerRequest) {
        chunks.push(idsToFetch.slice(i, i + maxPhotosPerRequest));
      }

      chunks.forEach(function(chunk) {
        var promise = internals.fetchPhotosFromApi.call(self, chunk);
        promises.push(promise);
      });

      var requests = Q.all(promises);
      requests
        .then(function(results) {
          var merged = [];
          merged = merged.concat.apply(merged, results);
          merged.forEach(function(photo) {
            var idsPos = ids.indexOf(photo.SfuId);
            returnedPhotos[photo.SfuId] = photo;
          });
          var arr = ids.map(function(id) {
            return returnedPhotos[id];
          });
          deferred.resolve(arr);
        })
        .fail(function(err) {
          deferred.reject(err);
        });
    })
    .fail(function(err) {
      deferred.reject(err);
    });

  return deferred.promise.nodeify(cb);
};

module.exports = PhotoClient;
