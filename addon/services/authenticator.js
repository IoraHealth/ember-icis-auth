import Ember from 'ember';

export default Ember.Service.extend({
  snowflake_provider: "CHANGEME",
  snowflake_url: "https://localhost",
  _tokenRefreshTimer: null,

  init() {
    const refreshAt = localStorage['token_refresh_at'];
    const rightNow = new Date().valueOf();

    if (refreshAt && refreshAt > rightNow) {
      const timeout = refreshAt - rightNow;
      this._queueTokenRefresh(timeout);
    }
  },

  authenticate: function() {
    return OAuth.redirect(this.get('snowflake_provider'), 'auth');
  },

  callback: function() {
    return OAuth.callback(this.get('snowflake_provider'))
                .done(this._oauthCallback.bind(this));
  },

  _queueTokenRefresh(msTimeout) {
    const context = this;
    const timer = Ember.run.later(context, function () {
      const baseUrl = context.get('snowflake_url');
      const accessToken = localStorage['access_token'];
      const url = `${baseUrl}/api/v1/tokens/${accessToken}/extend_token`;

      Ember.$.ajax(url, {
        method: 'PUT',
        contentType: 'application/json'
      }).done(context._oauthCallback.bind(context));
    }, msTimeout);

    this.set('_tokenRefreshTimer', timer);
  },

  _oauthCallback(result) {
    const accessToken = result.access_token;
    localStorage['access_token'] = accessToken;

    // Refresh access_token five minutes prior to expiry.
    const secsToExpire = result.expires_in;
    const msRefreshTimeout = (secsToExpire - 300) * 1000;
    localStorage['token_refresh_at'] = new Date().valueOf() + msRefreshTimeout;

    this._queueTokenRefresh(msRefreshTimeout);
  },

  destroy() {
    this._super(...arguments);

    const refreshTimer = this.get('_tokenRefreshTimer');

    if (refreshTimer) {
      Ember.run.cancel(refreshTimer);
    }
  }
});
