'use strict';

var extend = require('extend');
var request = require('request');
var fs = require('fs');
var Q = require('q');

var apiPaths = {
  token: '/Account/Token',
  photo: '/Values'
};

var internals = {};
internals.fetchPhotosFromApi = function(ids) {
  var deferred = Q.defer();
  var self = this;
  var options = {
    uri: this.config.endpoint + apiPaths.photo + '/' + ids.join(','),
    method: 'GET',
  };

  this.getToken().then(function(token) {
    options.headers = {
      'Authorization': 'Bearer ' + token
    };

    request(options, function(err, response, body) {
      if (err) {
        deferred.reject(err);
      } else if (response.statusCode !== 200) {
        deferred.reject(body);
      } else {
        var photoData = JSON.parse(body);
        deferred.resolve(photoData);
      }
    });
  });

  return deferred.promise;
};

function PhotoClient(options) {
  var config = {
    cache: {
      store: 'none',
      options: {}
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
  if (!config.maxPhotosPerRequest) {
    throw new Error('"maxPhotosPerRequest" value is required');
  }

  var CacheStore;
  if (typeof config.cache.store === 'function') {
    CacheStore = config.cache.store;
  } else if ((typeof config.cache.store === 'string') && (fs.existsSync('./cache_stores/' + config.cache.store + '.js'))) {
    CacheStore = require('./cache_stores/' + config.cache.store);
  } else {
    throw new Error('Invalid cache store specified: '+ config.cache.store.toString());
  }
  this.cache = new CacheStore(config.cache.options);
}

PhotoClient.prototype.getToken = function(cb) {
  var deferred = Q.defer();
  var options = {
    uri: this.config.endpoint + apiPaths.token,
    method: 'POST',
    form: {
      'AccountName': this.config.username,
      'Password': this.config.password
    }
  };
  
  var self = this;
  self.cache.getToken(function(err, token) {
    if (err || !token) {
      request(options, function(err, response, body) {
        if (err) {
          deferred.reject(body);
        } else if (response.statusCode !== 200) {
          err = new Error()
        } else {
          var token = JSON.parse(body)['ServiceToken'];
          self.cache.setToken(token);
          deferred.resolve(token);
        }
      });
    } else {
      deferred.resolve(token);
    }
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
  var idsToFetch = ids.map(function(x) { return x; });
  var cacheIds = ids.map(function(id) { return self.config.cache.photoPrefix + id; });

  function done() {
    var arr = ids.map(function(id) {
      return returnedPhotos[id];
    });
    deferred.resolve(arr);
  }

  self.cache.getPhotos(cacheIds, function(err, results) {
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

        // api tokens are limited to a set number of photos per GET request
        // break the idsToFetchArray into chunks of ids no more than the maxPhotosPerRequest value
        // and make GET requests in parallel
        var chunks = [], promises = [];
        var maxPhotosPerRequest = self.config.maxPhotosPerRequest;
        for (var i=0, j=idsToFetch.length; i<j; i+=maxPhotosPerRequest) {
          var tmparr = 
          chunks.push(idsToFetch.slice(i,i+maxPhotosPerRequest));
        }

        chunks.forEach(function(chunk) {
          var promise = internals.fetchPhotosFromApi.call(self, chunk);
          promises.push(promise);
        });

        var requests = Q.all(promises);
        requests.then(function(results) { 
          var merged = [];
          merged = merged.concat.apply(merged, results);
          merged.forEach(function(photo) {
            var idsPos = ids.indexOf(photo.SfuId);
            returnedPhotos[photo.SfuId] = photo;
          });
          done();
        }).fail(function(err) {
          deferred.reject(err);
        });
      } else {
        done();
      }
    }
  });
  return deferred.promise.nodeify(cb);
}

module.exports = PhotoClient;