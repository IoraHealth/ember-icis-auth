/* jshint expr:true */
import { expect } from 'chai';
import Ember from 'ember';
import {
  beforeEach,
  afterEach,
  describe,
  context,
  it
} from 'mocha';
import { setupTest } from 'ember-mocha';
import sinon from 'sinon';

describe('AuthenticatorService', function() {
  setupTest('service:authenticator', {
    needs: ['service:oauth2']
  });

  describe("#init", function () {
    context("token_refresh_at exists in localStorage", function () {
      let authenticator, clock, now;

      beforeEach(function () {
        authenticator = this.subject();

        now = new Date().valueOf();
        clock = sinon.useFakeTimers(now);
        sinon.stub(authenticator, 'scheduleTokenRefresh');
      });

      afterEach(function () {
        clock.restore();
        authenticator.scheduleTokenRefresh.restore();
        localStorage.removeItem("token_refresh_at");
      });

      context("token_refresh_at is after current time", function () {
        let refreshAt;

        beforeEach(function () {
          refreshAt = now + 100000;
          localStorage["token_refresh_at"] = refreshAt;
          authenticator.init();
        });

        it("queues up a token refresh", function () {
          expect(authenticator.scheduleTokenRefresh.calledOnce).to.be.true;
          expect(authenticator.scheduleTokenRefresh.calledWith(now - refreshAt));
        });
      });

      context('token_refresh_at is before the current time', function () {
        beforeEach(function () {
          localStorage["token_refresh_at"] = now - 10000;
          authenticator.init();
        });

        it("does not queue up a token refresh", function () {
          expect(authenticator.scheduleTokenRefresh.called).to.be.false;
        });
      });
    });
  });

  describe("#authenticate", function () {
    let authenticator, oauth2;

    beforeEach(function () {
      authenticator = this.subject();
      oauth2 = authenticator.get('oauth2');
    });

    afterEach(function() {
      oauth2.setProvider.restore();
      oauth2.authorize.restore();
    });

    it('sets up the ouath2 service and calls authorize', function() {
      sinon.stub(oauth2, 'setProvider');
      sinon.stub(oauth2, 'authorize');

      authenticator.authenticate();

      expect(oauth2.setProvider).to.have.been.calledWith('snowflake');
      const redirectUri = oauth2.get('redirectUri');
      expect(redirectUri).to.equal(`${window.location.origin}/token`);
      expect(oauth2.authorize).to.have.been.called;
    });
  });

  describe("#verify", function () {
    let authenticator, oauth2, hash, expires_in;

    beforeEach(function () {
      authenticator = this.subject();
      sinon.stub(authenticator, 'scheduleTokenRefresh');

      oauth2 = authenticator.get('oauth2');
      oauth2.saveState(oauth2.requestObj());
      sinon.stub(oauth2, 'setProvider');

      expires_in = 7200;
      hash = `#access_token=foo&response_type=token&expires_in=${expires_in}&state=${oauth2.get('state')}`;
    });

    afterEach(function() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_refresh_at');
      authenticator.scheduleTokenRefresh.restore();
      oauth2.setProvider.restore();
      oauth2.clearStates();
      oauth2.removeToken();
    });

    it('puts the token into local storage and schedules a refresh', function() {
      authenticator.verify(hash);
      expect(localStorage['access_token']).to.equal('foo');
      const fiveMinutesBeforeExpiry = (expires_in - 5 * 60);
      const expectedMsTimeout = fiveMinutesBeforeExpiry * 1000;
      expect(authenticator.scheduleTokenRefresh).to.have.been.calledWith(expectedMsTimeout);
    });

    it('does not do anything if the redirect is invalid', function() {
      hash += '-blah';
      authenticator.verify(hash);
      expect(localStorage['access_token']).to.beNull;
      expect(authenticator.scheduleTokenRefresh).not.to.have.been.called;
    });
  });

  describe("#scheduleTokenRefresh", function () {
    let authenticator, msTimeout;

    beforeEach(function () {
      authenticator = this.subject();
      msTimeout = 5000;
    });

    it("calls cancelTokenRefresh to cancel any scheduled token refreshes", function () {
      sinon.spy(authenticator, 'cancelTokenRefresh');

      authenticator.scheduleTokenRefresh(msTimeout);

      expect(authenticator.cancelTokenRefresh.calledOnce).to.be.true;

      authenticator.cancelTokenRefresh.restore();
    });

    it("schedules a token refresh with the Ember run loop", function () {
      sinon.spy(Ember.run, 'later');

      authenticator.scheduleTokenRefresh(msTimeout);

      expect(Ember.run.later.calledWith(authenticator, authenticator.tokenRefresh, msTimeout)).to.be.true;

      Ember.run.later.restore();
    });

    it("updates the internal timer reference", function () {
      const timerResponse = "I am timer";

      sinon.stub(Ember.run, 'later').returns(timerResponse);

      authenticator.scheduleTokenRefresh(msTimeout);

      expect(authenticator.get('_tokenRefreshTimer')).to.eq(timerResponse);

      Ember.run.later.restore();
    });
  });

  describe('#cancelTokenRefresh', function () {
    let authenticator;

    context('when a timer exists', function () {
      let timer;

      beforeEach(function () {
        timer = 'i am timer';
        authenticator = this.subject();
        authenticator.set('_tokenRefreshTimer', timer);
        sinon.stub(Ember.run, 'cancel').returns(true);
      });

      afterEach(function () {
        Ember.run.cancel.restore();
      });

      it("calls out to cancel it in the Ember run loop", function () {
        authenticator.cancelTokenRefresh();
        expect(Ember.run.cancel.calledOnce).to.be.true;
        expect(Ember.run.cancel.calledWith(timer)).to.be.true;
      });

      it("returns the result of Ember.run.cancel", function () {
        expect(authenticator.cancelTokenRefresh()).to.be.true;
      });
    });

    context('when a timer does not exist', function () {
      beforeEach(function () {
        authenticator = this.subject();
      });

      it("returns true", function () {
        expect(authenticator.cancelTokenRefresh()).to.be.true;
      });
    });
  });

  describe("#tokenRefresh", function () {
    let authenticator, endpoint, ajaxOptions, accessToken;

    beforeEach(function () {
      accessToken = 'deadbeef';
      endpoint = `https://localhost/api/v1/tokens/${accessToken}/extend_token`;
      ajaxOptions = { method: 'PUT', contentType: 'application/json' };

      localStorage["access_token"] = accessToken;

      authenticator = this.subject();
    });

    afterEach(function () {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_refresh_at");
    });

    context("regardless of response", function () {
      beforeEach(function () {
        let deferred = Ember.$.Deferred();
        sinon.stub(Ember.$, 'ajax').returns(deferred);

        authenticator.tokenRefresh();
      });

      afterEach(function () {
        Ember.$.ajax.restore();
      });

      it("hits snowflake's /api/v1/tokens/{token}/extend_token endpoint", function () {
        expect(Ember.$.ajax.calledWith(endpoint, ajaxOptions)).to.be.true;
      });
    });

    context('when the call is successful', function () {
      let now, clock, msTimeout, expectedTokenRefreshAt;

      beforeEach(function () {
        let deferred = Ember.$.Deferred();
        let expiresIn = 600;
        deferred.resolve({ access_token: accessToken, expires_in: expiresIn });

        now = new Date().valueOf();
        clock = sinon.useFakeTimers(now);
        msTimeout = (expiresIn - 300) * 1000;
        expectedTokenRefreshAt = now + msTimeout;

        authenticator = this.subject();

        sinon.spy(authenticator, 'scheduleTokenRefresh');

        sinon.stub(Ember.$, 'ajax').returns(deferred);

        authenticator.tokenRefresh();
      });

      afterEach(function () {
        clock.restore();
        authenticator.scheduleTokenRefresh.restore();
        Ember.$.ajax.restore();
      });

      it("sets token_refresh_at in localStorage from result's expires_in", function () {
        expect(localStorage['token_refresh_at']).to.equal(expectedTokenRefreshAt.toString());
      });

      it('queues up a token refresh', function () {
        expect(authenticator.scheduleTokenRefresh.calledOnce).to.be.true;
        expect(authenticator.scheduleTokenRefresh.calledWithExactly(msTimeout)).to.be.true;
      });
    });

    context('when the response is 401', function () {
      beforeEach(function () {
        let deferred = Ember.$.Deferred();
        deferred.reject({ status: 401 });

        sinon.stub(Ember.$, 'ajax').returns(deferred);
        sinon.stub(authenticator, 'authenticate');

        authenticator.tokenRefresh();
      });

      afterEach(function () {
        authenticator.authenticate.restore();
        Ember.$.ajax.restore();
      });

      it('makes the user re-auth', function () {
        expect(authenticator.authenticate).to.have.been.called;
      });
    });
  });

  describe("#destroy", function () {
    let authenticator;

    beforeEach(function () {
      authenticator = this.subject();
      sinon.spy(authenticator, 'cancelTokenRefresh');
      authenticator.destroy();
    });

    afterEach(function () {
      authenticator.cancelTokenRefresh.restore();
    });

    it("cancels any scheduled timers", function () {
      expect(authenticator.cancelTokenRefresh.calledOnce).to.be.true;
    });
  });
});
