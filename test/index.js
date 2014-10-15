'use strict';

var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.should();
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
  
  it('should return a string and not an error', function(done) {
    var client = new PhotoClient(config);
    client.getToken(function(err, token) {
      chai.expect(err).to.not.exist;
      token.should.not.be.empty;
      token.should.be.a('string');
      done();
    });
  });

});

describe('#getPhoto', function() {
  
  it('should return a string and not an error', function(done) {
    var client = new PhotoClient(config);
    client.getPhoto(973004918, function(err, photo) {
      chai.expect(err).to.not.exist;
      photo.should.not.be.empty;
      photo.should.be.a('string');
      done();
    });
  });

});