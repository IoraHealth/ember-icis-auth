import Ember from 'ember';

const SECS_BEFORE_EXPIRY = 300; // 5 minutes in seconds
const SECS_TO_MILLISECS = 1000; // 1 second in milliseconds

export default Ember.Service.extend({
  snowflake_provider: "CHANGEME",
  snowflake_url: "https://localhost",
  _tokenRefreshTimer: null,

  init() {
    this._super(...arguments);

    const refreshAt = localStorage['token_refresh_at'];
    const rightNow = new Date().valueOf();

    if (refreshAt && refreshAt > rightNow) {
      const timeout = refreshAt - rightNow;
      this.scheduleTokenRefresh(timeout);
    }
  },

  authenticate: function() {
    return OAuth.redirect(this.get('snowflake_provider'), 'auth');
  },

  callback: function() {
    return OAuth.callback(this.get('snowflake_provider'))
                .done(Ember.run.bind(this, this._oauthCallback));
  },

  scheduleTokenRefresh(msTimeout) {
    this.cancelTokenRefresh();

    const timer = Ember.run.later(this, this.tokenRefresh, msTimeout);

    this.set('_tokenRefreshTimer', timer);
  },

  cancelTokenRefresh() {
    const refreshTimer = this.get('_tokenRefreshTimer');

    if (refreshTimer) {
      return Ember.run.cancel(refreshTimer);
    }
    return true;
  },

  tokenRefresh() {
    const baseUrl = this.get('snowflake_url');
    const accessToken = localStorage['access_token'];
    const url = `${baseUrl}/api/v1/tokens/${accessToken}/extend_token`;

    return Ember.$.ajax(url, {
      method: 'PUT',
      contentType: 'application/json'
    }).then(Ember.run.bind(this, this._oauthCallback), (response) => {
      if (response.status === 401) {
        this.authenticate();
      }
    });
  },

  _oauthCallback(result) {
    const accessToken = result.access_token;
    localStorage['access_token'] = accessToken;

    // Refresh access_token five minutes prior to expiry.
    const secsToExpire = result.expires_in;
    const msRefreshTimeout = (secsToExpire - SECS_BEFORE_EXPIRY) * SECS_TO_MILLISECS;
    localStorage['token_refresh_at'] = new Date().valueOf() + msRefreshTimeout;

    this.scheduleTokenRefresh(msRefreshTimeout);
  },

  destroy() {
    this._super(...arguments);
    this.cancelTokenRefresh();
  }
});
