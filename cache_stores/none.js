function CacheStore(options) {}

CacheStore.prototype.getPhotos = function(ids) {
  return ids.map(function(id) {
    return null;
  });
};

CacheStore.prototype.setPhotos = function(photos) {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

CacheStore.prototype.getToken = function() {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

CacheStore.prototype.setToken = function(token) {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

CacheStore.prototype.flushToken = function() {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

CacheStore.prototype.flushPhotos = function() {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

CacheStore.prototype.flushAll = function() {
  return new Promise((resolve, reject) => {
    resolve(null);
  });
};

module.exports = CacheStore;
