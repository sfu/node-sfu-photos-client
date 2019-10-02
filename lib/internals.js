'use strict';
const internals = {};
const Q = require('q');
const request = require('request');
const apiPaths = {
  token: '/Account/Token',
  photo: '/Values',
};

internals.fetchTokenFromApi = function() {
  const deferred = Q.defer();
  const self = this;
  const options = {
    uri: this.config.endpoint + apiPaths.token,
    method: 'POST',
    form: {
      AccountName: this.config.username,
      Password: this.config.password,
    },
  };

  request(options, function(err, response, body) {
    if (err) {
      deferred.reject(err);
    } else if (response.statusCode !== 200) {
      deferred.reject(body);
    } else {
      const token = JSON.parse(body)['ServiceToken'];
      self.cache.setToken(token).then(function() {
        deferred.resolve(token);
      });
    }
  });
  return deferred.promise;
};

internals.fetchPhotosFromApi = function(ids) {
  const deferred = Q.defer();
  const self = this;
  const options = {
    uri: this.config.endpoint + apiPaths.photo + '/' + ids.join(','),
    method: 'GET',
  };

  self
    .getToken()
    .then(function(token) {
      options.headers = {
        Authorization: 'Bearer ' + token,
      };

      request(options, function(err, response, body) {
        if (err) {
          deferred.reject(err);
        } else if (response.statusCode !== 200) {
          deferred.reject(body);
        } else {
          const photoData = JSON.parse(body);
          const filteredPhotoData = photoData.filter(function(
            element,
            index,
            array
          ) {
            return element.PictureIdentification !== null;
          });
          internals.resizeImagesToWidth
            .call(self, filteredPhotoData)
            .then(function(photoData) {
              self.cache.setPhotos(photoData).then(function() {
                deferred.resolve(photoData);
              });
            });
        }
      });
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

internals.resizeImage = function(data, width) {
  const deferred = Q.defer();
  lwip.open(data, 'jpeg', function(err, image) {
    if (err) {
      deferred.reject(err);
    } else {
      if (image.width() > width) {
        image.scale(width / image.width(), function(err, image) {
          if (err) {
            deferred.reject(err);
          } else {
            image.toBuffer('jpg', { quality: 70 }, function(err, buffer) {
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve(buffer.toString('base64'));
              }
            });
          }
        });
      } else {
        deferred.resolve(data);
      }
    }
  });
  return deferred.promise;
};

internals.resizeImagesToWidth = function(data, width) {
  const deferred = Q.defer();
  const self = this;
  if (!self.config.hasOwnProperty('maxWidth')) {
    deferred.resolve(data);
  } else {
    const maxWidth = self.config.maxWidth;
    const promises = [];
    data.forEach(function(item) {
      if (!item.PictureIdentification) {
        return;
      }
      const image = new Buffer(item.PictureIdentification, 'base64');
      promises.push(internals.resizeImage(image, maxWidth));
    });

    Q.all(promises)
      .then(function(results) {
        results.forEach(function(image, index) {
          data[index].PictureIdentification = image.toString('base64');
        });
        deferred.resolve(data);
      })
      .fail(function(err) {
        deferred.reject(err);
      })
      .fail(deferred.reject);
  }
  return deferred.promise;
};

module.exports = internals;
