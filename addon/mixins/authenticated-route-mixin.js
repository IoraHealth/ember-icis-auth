import Ember from 'ember';

export default Ember.Mixin.create({
  token: localStorage['access_token'],
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',
  practice_id: localStorage['practice_id'],

  beforeModel: function(transition) {
    this._super(transition);

    var token = this.get('token');
    if(!token) {
      this._authenticate();
    } else {
      var _this = this;

      return this.store.find('current-user', 'me').then(

        function(currentUser) {
          _this.set('user', currentUser);
          _this.set('practiceUser', _this._getPracticeUser(currentUser, _this.get('practice_id')));

          return Ember.RSVP.resolve(currentUser);
        }
      );
    }
  },

  setupController: function(controller, model) {
    var superResult = this._super(controller, model);

    var currentUser  = this.get('user');
    var practiceUser = this._getPracticeUser(currentUser, this.get('practice_id'));
    controller.set('practiceUser', practiceUser);

    return superResult;
  },

  _authenticate: function() {
    return OAuth.redirect(this.get('snowflake_provider'), 'auth');
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
      this._authenticate();
    }
  }
});