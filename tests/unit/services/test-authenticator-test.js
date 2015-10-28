/* jshint expr:true */
import { expect } from 'chai';
import {
  describeModule,
  it
} from 'ember-mocha';

describeModule(
  'service:test-authenticator',
  'TestAuthenticatorService',
  {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
  },
  function() {

  it('#authenticate returns a deferred object which always resolves', function(done) {
    var authenticator = this.subject();

    authenticator.authenticate().done(function() {
      done();
    });
  });

  it('#callback returns a deferred object which resolves with the configured access_token', function(done) {
    var authenticator = this.subject();
    authenticator.set('access_token', 'i like turtles');

    authenticator.callback().done(function(result) {
      expect(result.access_token).to.equal('i like turtles');
      done();
    });
  });

  it('#callback sets the configured access_token in localStorage', function() {
    var authenticator = this.subject();
    authenticator.set('access_token', 'boogie in your butt');

    authenticator.callback();

    expect(localStorage.access_token).to.equal('boogie in your butt');
  });
});
