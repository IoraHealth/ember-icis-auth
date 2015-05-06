import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function(transition) {
    var access_token = transition.queryParams.access_token;
    localStorage['access_token'] = access_token;

    return this.transitionTo('index');
  }
});
