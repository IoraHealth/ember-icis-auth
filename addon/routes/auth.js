import Ember from 'ember';

export default Ember.Route.extend({
  snowflake_provider: "CHANGEME",

  beforeModel: function(transition) {
    var _this = this;
    return this.authenticator.callback().done(function() {
      _this.transitionToTargetRoute(transition);
    });
  },

  transitionToTargetRoute: function() {
    this.transitionTo('index');
  }
});
