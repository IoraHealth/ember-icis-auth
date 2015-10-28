/* jshint expr:true */
import { expect } from 'chai';
import Ember from 'ember';
import {
  beforeEach,
  afterEach
} from 'mocha';
import {
  describeModule,
  it
} from 'ember-mocha';

describeModule(
  'service:authenticator',
  'AuthenticatorService',
  {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
  },
  function() {
    beforeEach(function() {
      this.oldOAuth = window.OAuth;
      window.OAuth = {};
    });

    afterEach(function() {
      window.OAuth = this.oldOAuth;
    });

    it('#authenticate uses OAuth redirect with snowflake provider and auth callback url', function(done) {
      // stub redirect
      OAuth.redirect = function(provider, callbackUrl) {
        expect(provider).to.equal(authenticator.get('snowflake_provider'));
        expect(callbackUrl).to.equal('auth');
        done();
      };

      var authenticator = this.subject();

      authenticator.authenticate();
    });

    it('#callback calls OAuth.callback using snowflake provider', function(done) {
      var deferred = Ember.$.Deferred();

      //stub callback
      OAuth.callback = function(provider) {
        expect(provider).to.equal(authenticator.get('snowflake_provider'));
        done();
        return deferred;
      };

      var authenticator = this.subject();

      authenticator.callback();
    });

    it('#callback sets access_token from result in localStorage', function() {
      var deferred = Ember.$.Deferred();
      deferred.resolve({access_token: '123unicorn'});

      //stub callback
      OAuth.callback = function() {
        return deferred;
      };

      var authenticator = this.subject();

      authenticator.callback();

      expect(localStorage['access_token']).to.equal('123unicorn');
    });

    it('#callback returns the deferred object returned by OAuth', function() {
      var deferred = Ember.$.Deferred();

      //stub callback
      OAuth.callback = function(provider) {
        expect(provider).to.equal(authenticator.get('snowflake_provider'));
        return deferred;
      };

      var authenticator = this.subject();

      expect(authenticator.callback()).to.equal(deferred);
    });
  }
);

