var Q = require('q');

function CacheStore(options) {}

CacheStore.prototype.getPhotos = function(ids) {
    var deferred = Q.defer();
    deferred.resolve(ids.map(function(id) { return null; }));
    return deferred.promise;
};

CacheStore.prototype.setPhotos = function(photos) {
    var deferred = Q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

CacheStore.prototype.getToken = function() {
    var deferred = Q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

CacheStore.prototype.setToken = function(token) {
    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise;
};

CacheStore.prototype.flushToken = function() {
    var deferred = Q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

CacheStore.prototype.flushPhotos = function() {
    var deferred = Q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

CacheStore.prototype.flushAll = function() {
    var deferred = Q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

module.exports = CacheStore;