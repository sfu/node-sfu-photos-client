'use strict';

var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var config = require('./config');
var PhotoClient = require('../index');

describe('Initialization', function() {

  it('should throw an error if no API endpoint passed in config', function(done) {
    (function() { return new PhotoClient({endpoint: null}); }).should.Throw();
    done();
  })

  it('should throw an error if no username passed in config', function(done) {
    (function() { return new PhotoClient({endpoint: 'http://photos-api', username: null}); }).should.Throw();
    done();
  });

  it('should throw an error if no password passed in config', function(done) {
    (function() { return new PhotoClient({endpoint: 'http://photos-api', username: 'test'}); }).should.Throw();
    done();
  });

  it('should throw an error if no maxPhotosPerRequest passed in config', function(done) {
    (function() { return new PhotoClient({endpoint: 'http://photos-api', username: 'test', password: 'password'}); }).should.Throw();
    done();
  });

  it('should throw an error if an invalid cache store is specified in config', function(done) {
    var opts = JSON.parse(JSON.stringify(config));
    opts.cache.store = 'invalid';
    (function() { return new PhotoClient(opts); }).should.Throw();
    done();
  });

  it('should not throw an error if both username and password passed in config', function(done) {
    (function() { return new PhotoClient(config); }).should.not.Throw();
    done();
  });

});

describe('#getToken', function() {

  var client = new PhotoClient(config);

  beforeEach(function(done) {
    client.cache.flush(function() { done(); });
  });

  it('should return a string and not an error', function(done) {
    client.getToken(function(err, token) {
      chai.expect(err).to.not.exist;
      token.should.not.be.empty;
      token.should.be.a('string');
      done();
    });
  });

});

describe('#getPhoto', function() {

  var client = new PhotoClient(config);

  beforeEach(function(done) {
    client.cache.flush(function() { done(); });
  });
  
  it('it should return a single photo in an array and not an error and match the fixture data', function(done) {
    var fixtures = require('./fixtures/1user.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      photos.should.be.an('array');
      photos.should.deep.equal(fixtures);
      done();
    });
  });

  it('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', function(done) {
    var fixtures = require('./fixtures/10users.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      photos.should.be.an('array');
      photos.should.have.length(fixtures.length);
      photos.should.deep.equal(fixtures);
      done();
    });
  });

  it('should return photos in the same order in which they were requested', function(done) {
    var fixtures = require('./fixtures/10users.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      var returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should handle requesting more photos than the token allows', function(done) {
    var ids = ['200057415','973004918','943014302','933013725','943011423','555003006','870125854','200038771','555002960','831015698','892012342'];
    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      done();
    });
  });

describe('#getPhoto with promises', function() {
  this.timeout(10000);
  var client = new PhotoClient(config);

  beforeEach(function(done) {
    client.cache.flushPhotos(function() { done(); });
  });

  it('it should return a single photo in an array and not an error and match the fixture data', function(done) {
    var fixtures = require('./fixtures/1user.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    return client.getPhoto(ids).should.eventually.be.an('array').
           and.deep.equal(fixtures).
           and.notify(done);
  });

  it('should return multiple photos in an array of the same length as the fixture data and not an error and match the fixture data', function(done) {
    var fixtures = require('./fixtures/10users.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    return client.getPhoto(ids).should.eventually.be.an('array').
           and.have.length(fixtures.length).
           and.deep.equal(fixtures).
           and.notify(done);
  });

  it('should return photos in the same order in which they were requested', function(done) {
    var fixtures = require('./fixtures/10users.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    var promise = client.getPhoto(ids);
    var returnedIds = [];
    return promise.then(function(photos) {
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should handle requesting more photos than the maxPhotosPerRequest value', function(done) {
    var fixtures = require('./fixtures/11users.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });

    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      var returnedIds = [];
      photos.forEach(function(photo) {
        returnedIds.push(photo.SfuId);
      });
      ids.should.deep.equal(returnedIds);
      done();
    });
  });

  it('should accept a string literal as the id paramter', function(done) {
    var fixtures = require('./fixtures/1user.json');
    var ids = fixtures[0].SfuId;
    return client.getPhoto(ids).should.eventually.be.an('array').
           and.deep.equal(fixtures).
           and.notify(done);
  });

  it('should accept a number literal as the id paramter', function(done) {
    var fixtures = require('./fixtures/1user.json');
    var ids = parseInt(fixtures[0].SfuId);
    return client.getPhoto(ids).should.eventually.be.an('array').
           and.deep.equal(fixtures).
           and.notify(done);
  });


});