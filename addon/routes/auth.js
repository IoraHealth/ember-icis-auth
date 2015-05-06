import Ember from 'ember';

export default Ember.Route.extend({
  snowflake_provider: "CHANGEME",

  setupController: function() {
    var _this = this;

    OAuth.callback(this.get('snowflake_provider')).done(function(result) {
      localStorage['access_token'] = result.access_token;
      _this.transitionTo('index');
    });
  }
});
