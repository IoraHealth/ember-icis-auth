import {
  moduleFor,
  test
} from 'ember-qunit';

import Ember from 'ember';

var oldOAuth;

moduleFor('service:authenticator', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  setup: function() {
    oldOAuth = window.OAuth;
    window.OAuth = {};
  },

  teardown: function() {
    window.OAuth = oldOAuth;
  }
});

test('#authenticate uses OAuth redirect with snowflake provider and auth callback url', function(assert) {
  assert.expect(2);

  // stub redirect
  OAuth.redirect = function(provider, callbackUrl) {
    assert.equal(provider, authenticator.get('snowflake_provider'));
    assert.equal(callbackUrl, 'auth');
  };

  var authenticator = this.subject();

  authenticator.authenticate();
});

test('#callback calls OAuth.callback using snowflake provider', function(assert) {
  assert.expect(1);

  var deferred = Ember.$.Deferred();

  //stub callback
  OAuth.callback = function(provider) {
    assert.equal(provider, authenticator.get('snowflake_provider'));
    return deferred;
  };

  var authenticator = this.subject();

  authenticator.callback();
});

test('#callback sets access_token from result in localStorage', function(assert) {
  var deferred = Ember.$.Deferred();
  deferred.resolve({access_token: '123unicorn'});

  //stub callback
  OAuth.callback = function() {
    return deferred;
  };

  var authenticator = this.subject();

  authenticator.callback();

  assert.equal(localStorage['access_token'], '123unicorn');
});

test('#callback returns the deferred object returned by OAuth', function(assert) {
  var deferred = Ember.$.Deferred();

  //stub callback
  OAuth.callback = function(provider) {
    assert.equal(provider, authenticator.get('snowflake_provider'));
    return deferred;
  };

  var authenticator = this.subject();

  assert.equal(authenticator.callback(), deferred);
});
