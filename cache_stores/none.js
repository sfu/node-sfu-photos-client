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

CacheStore.prototype.flush = function(cb) {
    cb();
};

module.exports = CacheStore;