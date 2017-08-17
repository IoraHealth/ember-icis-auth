import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function(transition) {
    this.get('authenticator').verify(window.location.hash);
    if (localStorage['access_token']) {
      return this.transitionToTargetRoute(transition);
    }
  },

  transitionToTargetRoute: function() {
    this.transitionTo('index');
  }
});
