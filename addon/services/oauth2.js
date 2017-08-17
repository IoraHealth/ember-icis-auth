import oauth2 from 'ember-oauth2/services/ember-oauth2';

export default oauth2.extend({
  /**
   * ember-oauth2 by default opens the authorization flow in a pop-up
   * window, but we don't want to do that.
   **/
  openWindow(url) {
    window.location = url;
  },

  /**
   * Since ember-oauth2 opens a new window for auth, it assumes there's a
   * persistent state key in memory. Since we're actually doing redirects,
   * we need to see if the state key comes from the URL.
   **/
  stateKeyName() {
    if (!this.get('state')) {
      const state = this.parseCallback(window.location.hash).state;
      if (state) {
        this.set('state', state);
      } else {
        this.generateState();
      }
    }
    return this.get('statePrefix') + '-' + this.get('state');
  },

  /**
   * ember-oauth2 converts the token's expires_in parameter to a relative time,
   * so it becomes more like expires_at. We have our own refresh handling so
   * we need to makre sure the parameter doesn't change.
   **/
  expiresIn: function(expires) {
    return expires;
  },
});
