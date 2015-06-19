import Ember from 'ember';

export default Ember.Service.extend({
  snowflake_provider: "CHANGEME",

  authenticate: function() {
    return OAuth.redirect(this.get('snowflake_provider'), 'auth');
  },

  callback: function() {
    return OAuth.callback(this.get('snowflake_provider')).done(function(result) {
      localStorage['access_token'] = result.access_token;
    });
  }
});
