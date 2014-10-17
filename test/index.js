'use strict';

var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var config = require('./config');
var PhotoClient = require('../index');

describe('Initialization', function() {

  it('should throw an error if no API endpoint passed', function(done) {
    (function() { return new PhotoClient({endpoint: null}); }).should.Throw();
    done();
  })

  it('should throw an error if no username passed', function(done) {
    (function() { return new PhotoClient({username: null}); }).should.Throw();
    done();
  });

  it('should throw an error if no password passed', function(done) {
    (function() { return new PhotoClient({username: 'test'}); }).should.Throw();
    done();
  });

  it('should not throw an error if both username and password passed', function(done) {
    (function() { return new PhotoClient(config); }).should.not.Throw();
    done();
  });

});

describe('#getToken', function() {

  var client = new PhotoClient(config);
  before(function(done) {
    client.flushCache('token');
    done();
  });

  it('should return a string and not an error', function(done) {
    // var client = new PhotoClient(config);
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

  before(function(done) {
    client.flushCache('photo');
    done();
  });
  
  it('call for a single photo should return an array of one photo and not an error and should match the sample data', function(done) {
    var fixtures = require('./fixtures/1user.json');
    var ids = fixtures.map(function(x) { return x.SfuId; });
    client.getPhoto(ids, function(err, photos) {
      chai.expect(err).to.not.exist;
      photos.should.be.an('array');
      photos[0].should.be.an('object');
      photos.should.deep.equal(fixtures);
      done();
    });
  });



});