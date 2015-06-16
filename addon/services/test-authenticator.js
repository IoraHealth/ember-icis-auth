import Ember from 'ember';

export default Ember.Service.extend({
  // should be set to whatever is desired for test run
  access_token: "CHANGEME",

  authenticate: function() {
    return Ember.$.Deferred().resolve();
  },

  callback: function() {
    var result = {
      access_token: this.get('access_token')
    };

    return Ember.$.Deferred().
      done(function(result) {
        localStorage['access_token'] = result.access_token;
      }).
      resolve(result);
  }
});
