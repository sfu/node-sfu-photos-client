'use strict';

var should = require('should');
var config = require('./config');
var PhotoClient = require('../index');
var assert = require('assert');

describe('Initialization', function() {

  it('should throw an error if no API endpoint passed', function(done) {
    (function() { return new PhotoClient({endpoint: null}); }).should.throw();
    done();
  })

  it('should throw an error if no username passed', function(done) {
    (function() { return new PhotoClient({username: null}); }).should.throw();
    done();
  });

  it('should throw an error if no password passed', function(done) {
    (function() { return new PhotoClient({username: 'test'}); }).should.throw();
    done();
  });

  it('should not throw an error if both username and password passed', function(done) {
    (function() { return new PhotoClient(config); }).should.not.throw();
    done();
  });

});

describe('#getToken', function() {
  
  it('AccountName property should match the username passed in config', function(done) {
    var client = new PhotoClient(config);
    client.getToken(function(token) {
      token.AccountName.should.equal(client.config.username);
      done();
    });
  });

  it('ServiceToken property should not be empty', function(done) {
    var client = new PhotoClient(config);
    client.getToken(function(token) {
      token.ServiceToken.should.not.be.empty;
      done();
    });
  });
});
