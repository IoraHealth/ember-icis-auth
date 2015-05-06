import Ember from 'ember';

export default Ember.Mixin.create({
  token: localStorage['access_token'],
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',
  practice_id: localStorage['practice_id'],

  beforeModel: function(transition) {
    var superResult = this._super(transition);

    var token = this.get('token');
    if(!token) {
      OAuth.redirect(this.get('snowflake_provider'), 'auth');
    }

    return superResult;
  },

  model: function() {
    return this.store.find('current-user', 'me');
  },

  setupController: function(controller, model) {
    this._super(controller, model);
    this.set('user', model);
    this.set('practiceUser', this._getPracticeUser(model, this.get('practice_id')));
    controller.set('practiceUser', this._getPracticeUser(model, this.get('practice_id')));
  },


  _getPracticeUser: function(currentUser, practiceId) {
    if (practiceId) {
      return currentUser.practiceUserByPracticeId(practiceId);
    } else {
      return currentUser.get('defaultPracticeUser');
    }
  },

  actions: {
    error: function() {
      OAuth.redirect(this.get('snowflake_provider'), 'auth');
    }
  }
});
