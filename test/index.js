'use strict';

var should = require('should');
var config = require('./config');
var PhotoClient = require('../index');
var assert = require('assert');

describe('Initialization', function() {

    it('should throw an error if no username passed', function(done) {
      (function() { return new PhotoClient(); }).should.throw();
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
});
