/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const expect = chai.expect;
const nock = require('nock');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
// const lwip = require('lwip');

const config = {
  username: 'username',
  password: 'password',
  endpoint: 'https://photos-api',
  maxPhotosPerRequest: 10,
  cache: {
    store: 'none',
  },
};

const PhotoClient = require('../index');

describe('Initialization', function() {
  it('should throw an error if no API endpoint passed in config', function(done) {
    (function() {
      return new PhotoClient({ endpoint: null });
    }.should.Throw());
    done();
  });

  it('should throw an error if no username passed in config', function(done) {
    (function() {
      return new PhotoClient({ endpoint: 'http://photos-api', username: null });
    }.should.Throw());
    done();
  });

  it('should throw an error if no password passed in config', function(done) {
    (function() {
      return new PhotoClient({
        endpoint: 'http://photos-api',
        username: 'test',
      });
    }.should.Throw());
    done();
  });

  it('should throw an error if no maxPhotosPerRequest passed in config', function(done) {
    (function() {
      return new PhotoClient({
        endpoint: 'http://photos-api',
        username: 'test',
        password: 'password',
      });
    }.should.Throw());
    done();
  });

  it('should throw an error if an invalid cache store is specified in config', function(done) {
    const opts = JSON.parse(JSON.stringify(config));
    opts.cache.store = 'invalid';
    (function() {
      return new PhotoClient(opts);
    }.should.Throw());
    done();
  });

  it('should not throw an error if both username and password passed in config', function(done) {
    (function() {
      return new PhotoClient(config);
    }.should.not.Throw());
    done();
  });
});

describe('#getToken with callbacks', function() {
  let client;

  beforeEach(function(done) {
    nock.disableNetConnect();
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client = new PhotoClient(config);
    client.cache.flushToken().then(function() {
      done();
    });
  });

  afterEach(function() {
    client = undefined;
    nock.cleanAll();
  });

  it('should return a string and not an error', function(done) {
    client.getToken(function(err, token) {
      expect(err).to.not.exist;
      token.should.not.be.empty;
      token.should.be.a('string');
      done();
    });
  });
});

describe('#getToken with promises', function() {
  let client;
  beforeEach(function(done) {
    client = new PhotoClient(config);
    nock.disableNetConnect();
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client.cache.flushToken().then(function() {
      done();
    });
  });

  afterEach(function() {
    client = undefined;
    nock.cleanAll();
  });

  it('should return a string and not an error', function(done) {
    const promise = client.getToken();
    return promise.should.eventually.be.a('string').and.notify(done);
  });
});

describe('#getPhoto with callbacks', function() {
  let client;

  beforeEach(function(done) {
    client = new PhotoClient(config);
    nock.disableNetConnect();
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    client.cache.flushPhotos().then(function() {
      done();
    });
  });

  afterEach(function() {
    client = undefined;
    nock.cleanAll();
  });

  it('should return a single photo in an array and not an error and match the fixture data', function(done) {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      photos.should.be.an('array');
      photos.should.deep.equal(fixtures);
      done();
    });
  });

  it('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', function(done) {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      photos.should.be.an('array');
      photos.should.have.length(fixtures.length);
      photos.should.deep.equal(fixtures);
      done();
    });
  });

  it('should return photos in the same order in which they were requested', function(done) {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      const returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should handle requesting more photos than the maxPhotosPerRequest value', function(done) {
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

    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      const returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should accept a number literal as the id paramter', function(done) {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = parseInt(fixtures[0].SfuId);
    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      photos.should.be.an('array');
      photos.should.deep.equal(fixtures);
      done();
    });
  });
});

describe('#getPhoto with promises', function() {
  let client;

  beforeEach(function(done) {
    client = new PhotoClient(config);
    client.cache.flushPhotos().then(function() {
      done();
    });
    nock.disableNetConnect();
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
  });

  afterEach(function() {
    client = undefined;
    nock.cleanAll();
  });

  it('should return a single photo in an array and not an error and match the fixture data', function(done) {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    return client
      .getPhoto(ids)
      .should.eventually.be.an('array')
      .and.deep.equal(fixtures)
      .and.notify(done);
  });

  it('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', function(done) {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    return client
      .getPhoto(ids)
      .should.eventually.be.an('array')
      .and.have.length(fixtures.length)
      .and.deep.equal(fixtures)
      .and.notify(done);
  });

  it('should return photos in the same order in which they were requested', function(done) {
    const fixtures = require('./fixtures/10users.json');
    nock(config.endpoint)
      .get(/\/Values\/(\d{9},?){10}$/)
      .reply(200, fixtures);
    const ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    const promise = client.getPhoto(ids);
    const returnedIds = [];
    return promise.then(function(photos) {
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should handle requesting more photos than the maxPhotosPerRequest value', function(done) {
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

    client.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      const returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should accept a string literal as the id paramter', function(done) {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = fixtures[0].SfuId;
    return client
      .getPhoto(ids)
      .should.eventually.be.an('array')
      .and.deep.equal(fixtures)
      .and.notify(done);
  });

  it('should accept a number literal as the id paramter', function(done) {
    const fixtures = require('./fixtures/1user.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    const ids = parseInt(fixtures[0].SfuId);
    return client
      .getPhoto(ids)
      .should.eventually.be.an('array')
      .and.deep.equal(fixtures)
      .and.notify(done);
  });
});

describe('image resizing', function() {
  config.maxWidth = 200;
  var resizingClient;

  beforeEach(function(done) {
    nock.disableNetConnect();
    nock(config.endpoint)
      .post('/Account/Token')
      .reply(200, '{"AccountName":"username","ServiceToken":"xxxx"}');
    resizingClient = new PhotoClient(config);
    resizingClient.cache.flushPhotos().then(function() {
      done();
    });
  });

  afterEach(function() {
    resizingClient = undefined;
    nock.cleanAll();
  });

  it('should return an image no larger than the maximum width set in config', function(done) {
    var fixtures = require('./fixtures/1user@200px.json');
    nock(config.endpoint)
      .get(/\/Values\/\d{9}$/)
      .reply(200, fixtures);
    var ids = fixtures.map(function(x) {
      return x.SfuId;
    });
    resizingClient.getPhoto(ids, function(err, photos) {
      expect(err).to.not.exist;
      photos.should.be.an('array');
      var buffer = new Buffer(photos[0].PictureIdentification, 'base64');
      lwip.open(buffer, 'jpeg', function(err, image) {
        expect(err).to.not.exist;
        expect(image).to.exist;
        expect(image.width()).to.be.at.most(config.maxWidth);
        done();
      });
    });
  });
});
