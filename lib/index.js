'use strict';

const extend = require('extend');
const fs = require('fs');
const path = require('path');
const internals = require('./internals');

function PhotoClient(options) {
  const config = {
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

  let CacheStore;
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

PhotoClient.prototype.getToken = async function() {
  try {
    let token = await this.cache.getToken();
    if (!token) {
      token = await internals.fetchTokenFromApi.call(this);
    }
    return token;
  } catch (error) {
    throw error;
  }
};

PhotoClient.prototype.getPhoto = async function(ids) {
  if (!Array.isArray(ids)) {
    ids = ids.toString().split(',');
  }
  const returnedPhotos = {};
  const idsToFetch = ids.map(function(x) {
    return x;
  });

  const cachedPhotos = await this.cache.getPhotos(ids);
  // cachedPhotos is an array that will have null values where there was no data in the cache
  // if we got back a cached photo we should remove the entry from the ids array and push the result into returnedPhotos
  cachedPhotos.forEach(function(photo) {
    if (photo) {
      photo = JSON.parse(photo);
      const idsPos = ids.indexOf(photo.SfuId);
      returnedPhotos[photo.SfuId] = photo;
      idsToFetch.splice(idsPos, 1);
    }
  });

  // api tokens are limited to a set number of photos per GET request
  // break the idsToFetchArray into chunks of ids no more than the maxPhotosPerRequest value
  // and make GET requests in parallel
  const chunks = [];
  const maxPhotosPerRequest = this.config.maxPhotosPerRequest;

  for (let i = 0, j = idsToFetch.length; i < j; i += maxPhotosPerRequest) {
    chunks.push(idsToFetch.slice(i, i + maxPhotosPerRequest));
  }

  const promises = chunks.map(chunk =>
    internals.fetchPhotosFromApi.call(this, chunk)
  );

  const fetchedPhotos = await Promise.all(promises);
  const merged = [].concat(...fetchedPhotos);

  merged.forEach(function(photo) {
    returnedPhotos[photo.SfuId] = photo;
  });
  const arr = ids.map(function(id) {
    return returnedPhotos[id];
  });
  return arr;
};

module.exports = PhotoClient;
