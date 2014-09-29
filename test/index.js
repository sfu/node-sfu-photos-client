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
  
  it('AccountName property should match the username passed in config', function(done) {
    var client = new PhotoClient(config);
    client.getToken().should.be.fulfilled.and.eventually.have.property('AccountName').that.equals('canvas').and.notify(done);
  });

  it('ServiceToken property should not be empty', function(done) {
    var client = new PhotoClient(config);
    client.getToken().should.be.fulfilled.and.eventually.have.property('ServiceToken').and.notify(done);
  });
});
