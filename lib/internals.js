'use strict'
var internals = {};

internals.fetchTokenFromApi = function() {
  var deferred = Q.defer();
  var self = this;
  var options = {
    uri: this.config.endpoint + apiPaths.token,
    method: 'POST',
    form: {
      'AccountName': this.config.username,
      'Password': this.config.password
    }
  };

  request(options, function(err, response, body) {
    if (err) {
      deferred.reject(err);
    } else if (response.statusCode !== 200) {
      deferred.reject(body)
    } else {
      var token = JSON.parse(body)['ServiceToken'];
      self.cache.setToken(token);
      deferred.resolve(token);
    }
  });
  return deferred.promise;
}

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
        self.cache.setPhotos(photoData, function(err, results) {
          deferred.resolve(photoData);
        });
      }
    });
  });

  return deferred.promise;
};

module.exports = internals;