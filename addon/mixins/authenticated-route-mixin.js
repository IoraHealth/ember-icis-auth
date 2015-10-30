import Ember from 'ember';

export default Ember.Mixin.create({
  token: localStorage['access_token'],
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',
  practice_id: localStorage['practice_id'],

  beforeModel: function(transition) {
    this._super(transition);

    if (transition.queryParams && transition.queryParams.access_token) {
      localStorage['access_token'] = transition.queryParams.access_token;
      this.set('token', localStorage['access_token']);
    }

    if(!this.get('token')) {
      this.authenticator.authenticate();
    } else {
      return this.findCurrentUser();
    }
  },

  setupController: function(controller, model) {
    var superResult = this._super(controller, model);

    var currentUser  = this.get('user');
    var practiceUser = this._getPracticeUser(currentUser, this.get('practice_id'));
    controller.set('practiceUser', practiceUser);

    return superResult;
  },

  findCurrentUser: function() {
    return this.store.find('current-user', 'me').then(

      (currentUser) => {
        this.set('user', currentUser);
        this.set('practiceUser', this._getPracticeUser(currentUser, this.get('practice_id')));

        return Ember.RSVP.resolve(currentUser);
      },

      (e) => {
        if(e.errors[0].status === '401') {
          this.authenticator.authenticate();
        }
        return Ember.RSVP.reject(e);
      }
    );
  },

  _getPracticeUser: function(currentUser, practiceId) {
    if (practiceId) {
      return currentUser.practiceUserByPracticeId(practiceId);
    } else {
      return currentUser.get('defaultPracticeUser');
    }
  }
});
