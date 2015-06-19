import {
  moduleFor,
  test
} from 'ember-qunit';

moduleFor('service:test-authenticator', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  var service = this.subject();
  assert.ok(service);
});

test('#authenticate returns a deferred object which always resolves', function(assert) {
  assert.expect(1);

  var authenticator = this.subject();

  authenticator.authenticate().done(function() {
    assert.ok(true);
  });
});

test('#callback returns a deferred object which resolves with the configured access_token', function(assert) {
  assert.expect(1);

  var authenticator = this.subject();
  authenticator.set('access_token', 'i like turtles');

  authenticator.callback().done(function(result) {
    assert.equal(result.access_token, 'i like turtles');
  });
});

test('#callback sets the configured access_token in localStorage', function(assert) {
  assert.expect(1);

  var authenticator = this.subject();
  authenticator.set('access_token', 'boogie in your butt');

  authenticator.callback();

  assert.equal(localStorage.access_token, 'boogie in your butt');
});
