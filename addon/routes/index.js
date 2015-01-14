import Ember from 'ember';

export default Ember.Route.extend({
  token: localStorage['access_token'],
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',

  beforeModel: function() {
    var token = this.get('token')

    if(!token) {
      OAuth.redirect(this.get('snowflake_provider'), 'auth')
    }
  },

  model: function() {
    var _this = this;
    var meUrl = this.get('snowflake_url') + "/api/v1/me.json?access_token=" + this.get('token');
    var me = Ember.$.getJSON(meUrl).fail(function() {
      OAuth.redirect(_this.get('snowflake_provider'), 'auth');
    });

    return me;
  }
});
