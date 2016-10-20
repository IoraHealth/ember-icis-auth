import Ember from 'ember';

export default Ember.Mixin.create({
  token: Ember.computed({
    get() {
      return localStorage['access_token'];
    },
    set(_, value) {
      if (value == null) {
        localStorage.removeItem('access_token');
      } else {
        localStorage['access_token'] = value;
      }
      return value;
    }
  }),
  snowflake_provider: 'CHANGEME',
  snowflake_url: 'CHANGEME',

  beforeModel: function(transition) {
    this._super(transition);

    if (transition.queryParams && transition.queryParams.access_token) {
      this.set('token', transition.queryParams.access_token);
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
          this.set('token', undefined);
          this.authenticator.authenticate();
        }
        return Ember.RSVP.reject(e);
      }
    );
  }
});
