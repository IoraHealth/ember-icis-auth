import Ember from 'ember';

export default Ember.Mixin.create({
  token: localStorage['access_token'],
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',

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

  findCurrentUser: function() {
    return this.store.find('current-user', 'me').then(

      (currentUser) => {
        this.set('user', currentUser);
        this.set('practiceUser', currentUser.get('currentPracticeUser'));

        return Ember.RSVP.resolve(currentUser);
      },

      (e) => {
        if(e.errors[0].status === '401') {
          localStorage.removeItem('access_token');
          this.authenticator.authenticate();
        }
        return Ember.RSVP.reject(e);
      }
    );
  }
});
