function CacheStore(options) {}

CacheStore.prototype.getPhotos = function(ids, cb) {
    cb(null, ids.map(function(id) { return null; }));
};

CacheStore.prototype.setPhotos = function(photos, cb) {
    cb(null, null);
};

CacheStore.prototype.getToken = function(cb) {
    cb(null, null);
};

CacheStore.prototype.setToken = function(token, cb) {
    if (cb) {
        cb(null, null);
    }
};

CacheStore.prototype.flushToken = function(cb) {
    cb();
};

CacheStore.prototype.flushPhotos = function(cb) {
    cb();
};

CacheStore.prototype.flushAll = function(cb) {
    cb();
};

module.exports = CacheStore;