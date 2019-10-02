/* eslint-disable no-unused-expressions */

'use strict';

const nock = require('nock');
const PhotoClient = require('../index');
nock.disableNetConnect();

const config = {
  username: 'username',
  password: 'password',
  endpoint: 'https://photos-api',
  maxPhotosPerRequest: 10,
  cache: {
    store: 'none',
  },
};

describe('Initialization', () => {
  test('should throw an error if no API endpoint passed in config', () => {
    expect(() => {
      new PhotoClient({ endpoint: null });
    }).toThrow();
  });

  test('should throw an error if no username passed in config', () => {
    expect(() => {
      new PhotoClient({ endpoint: 'http://photos-api', username: null });
    }).toThrow();
  });

  test('should throw an error if no password passed in config', () => {
    expect(() => {
      new PhotoClient({
        endpoint: 'http://photos-api',
        username: 'test',
      });
    }).toThrow();
  });

  test('should throw an error if no maxPhotosPerRequest passed in config', () => {
    expect(() => {
      return new PhotoClient({
        endpoint: 'http://photos-api',
        username: 'test',
        password: 'password',
      });
    }).toThrow();
  });

  test('should throw an error if an invalid cache store is specified in config', () => {
    const opts = JSON.parse(JSON.stringify(config));
    opts.cache.store = 'invalid';
    expect(() => {
      new PhotoClient(opts);
    }).toThrow();
  });

  test('should not throw an error if both username and password passed in config', () => {
    expect(() => {
      new PhotoClient(config);
    }).not.toThrow();
  });
});

describe('#getToken with callbacks', () => {
  let client;

  beforeEach(done => {
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client = new PhotoClient(config);
    client.cache.flushToken().then(function() {
      done();
    });
  });

  afterEach(() => {
    client = undefined;
    nock.cleanAll();
  });

  test('should return a string and not an error', done => {
    client.getToken(function(err, token) {
      expect(err).toBeNull();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      done();
    });
  });
});

describe('#getToken with promises', () => {
  let client;
  beforeEach(done => {
    client = new PhotoClient(config);
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client.cache.flushToken().then(function() {
      done();
    });
  });

  afterEach(() => {
    client = undefined;
    nock.cleanAll();
  });

  test('should return a string and not an error', () => {
    return client.getToken().then(data => {
      expect(typeof data).toBe('string');
    });
  });
});

describe('#getPhoto with callbacks', () => {
  let client;

  beforeEach(done => {
    client = new PhotoClient(config);
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, { AccountName: 'username', ServiceToken: 'xxxx' });
    client.cache.flushPhotos().then(function() {
      done();
    });
  });

  afterEach(() => {
    client = undefined;
    nock.cleanAll();
  });

  test('should return a single photo in an array and not an error and match the fixture data', done => {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(x => x.SfuId);
    return client.getPhoto(ids, (err, photos) => {
      expect(err).toBeNull();
      expect(photos).toEqual(fixtures);
      done();
    });
  });

  test('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', done => {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    return client.getPhoto(ids, function(err, photos) {
      expect(err).toBeNull();
      expect(photos).toEqual(fixtures);
      done();
    });
  });

  test('should return photos in the same order in which they were requested', done => {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    return client.getPhoto(ids, function(err, photos) {
      expect(err).toBeNull();
      const returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      expect(returnedIds).toEqual(ids);
      done();
    });
  });

  test('should handle requesting more photos than the maxPhotosPerRequest value', done => {
    const fixtures = require('./fixtures/11users.json');
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?)$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });

    return client.getPhoto(ids, (err, photos) => {
      expect(err).toBeNull();
      const returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      expect(returnedIds).toEqual(ids);
      done();
    });
  });

  test('should accept a number literal as the id paramter', done => {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = parseInt(fixtures[0].SfuId);
    return client.getPhoto(ids, function(err, photos) {
      expect(err).toBeNull();
      expect(photos).toEqual(fixtures);
      done();
    });
  });
});

describe('#getPhoto with promises', () => {
  let client;

  beforeEach(done => {
    client = new PhotoClient(config);
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client.cache.flushPhotos().then(function() {
      done();
    });
  });

  afterEach(() => {
    client = undefined;
    nock.cleanAll();
  });

  test('should return a single photo in an array and not an error and match the fixture data', () => {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(x => x.SfuId);
    return client.getPhoto(ids).then(data => {
      expect(data).toEqual(fixtures);
    });
  });

  test('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', () => {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    return client.getPhoto(ids).then(data => {
      expect(data).toEqual(fixtures);
    });
  });

  test('should return photos in the same order in which they were requested', () => {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });

    return client.getPhoto(ids).then(photos => {
      expect(photos.map(p => p.SfuId)).toEqual(ids);
    });
  });

  test('should handle requesting more photos than the maxPhotosPerRequest value', () => {
    const fixtures = require('./fixtures/11users.json');
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?)$/)
      .reply(200, fixtures);

    return client.getPhoto(ids).then(photos => {
      expect(photos.map(p => p.SfuId)).toEqual(ids);
    });
  });

  test('should accept a string literal as the id paramter', () => {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures[0].SfuId;
    return client.getPhoto(ids).then(data => {
      expect(data).toEqual(fixtures);
    });
  });

  test('should accept a number literal as the id paramter', () => {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = parseInt(fixtures[0].SfuId);
    return client.getPhoto(ids).then(data => {
      expect(data).toEqual(fixtures);
    });
  });
});

// describe('image resizing', () => {
//   config.maxWidth = 200;
//   var resizingClient;

//   beforeEach(done => {
//     nock(config.endpoint)
//       .post('/Account/Token')
//       .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
//     resizingClient = new PhotoClient(config);
//     resizingClient.cache.flushPhotos().then(function() {
//       done();
//     });
//   });

//   afterEach(() => {
//     resizingClient = undefined;
//     nock.cleanAll();
//   });

//   test('should return an image no larger than the maximum width set in config', done => {
//     var fixtures = require('./fixtures/1user@200px.json');
//     nock(config.endpoint)
//       .get(/\/Values\/\d{9}$/)
//       .reply(200, fixtures);
//     var ids = fixtures.map(function(x) {
//       return x.SfuId;
//     });
//     resizingClient.getPhoto(ids, function(err, photos) {
//       expect(err).toBeNull();
//       photos.should.be.an('array');
//       var buffer = new Buffer(photos[0].PictureIdentification, 'base64');
//       lwip.open(buffer, 'jpeg', function(err, image) {
//         expect(err).toBeNull();
//         expect(image).to.exist;
//         expect(image.width()).to.be.at.most(config.maxWidth);
//         done();
//       });
//     });
//   });
// });
