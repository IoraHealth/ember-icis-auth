/* jshint expr:true */
import { expect } from 'chai';
import Ember from 'ember';
import {
  beforeEach,
  afterEach,
  describe,
  context
} from 'mocha';
import {
  describeModule,
  it
} from 'ember-mocha';
import sinon from 'sinon';

describeModule(
  'service:authenticator',
  'AuthenticatorService',
  {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
  },
  function() {
    beforeEach(function() {
      this.oldOAuth = window.OAuth;
      window.OAuth = {};
    });

    afterEach(function() {
      window.OAuth = this.oldOAuth;
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
      it('uses OAuth redirect with snowflake provider and auth callback url', function(done) {
        // stub redirect
        OAuth.redirect = function(provider, callbackUrl) {
          expect(provider).to.equal(authenticator.get('snowflake_provider'));
          expect(callbackUrl).to.equal('auth');
          done();
        };

        var authenticator = this.subject();

        authenticator.authenticate();
      });
    });

    describe("#callback", function () {
      it('calls OAuth.callback using snowflake provider', function(done) {
        var deferred = Ember.$.Deferred();

        //stub callback
        OAuth.callback = function(provider) {
          expect(provider).to.equal(authenticator.get('snowflake_provider'));
          done();
          return deferred;
        };

        var authenticator = this.subject();

        authenticator.callback();
      });

      it('sets access_token from result in localStorage', function() {
        var deferred = Ember.$.Deferred();
        deferred.resolve({access_token: '123unicorn'});

        //stub callback
        OAuth.callback = function() {
          return deferred;
        };

        var authenticator = this.subject();

        authenticator.callback();

        expect(localStorage['access_token']).to.equal('123unicorn');
      });

      describe("refresh behavior", function () {
        let deferred, expiresIn, clock, authenticator, now,
            msTimeout, expectedTokenRefreshAt;

        beforeEach(function () {
          deferred = Ember.$.Deferred();
          expiresIn = 600;
          deferred.resolve({ access_token: 'deadbeef', expires_in: expiresIn });

          //stub callback
          OAuth.callback = () => deferred;

          now = new Date().valueOf();
          clock = sinon.useFakeTimers(now);
          msTimeout = (expiresIn - 300) * 1000;
          expectedTokenRefreshAt = now + msTimeout;

          authenticator = this.subject();

          sinon.spy(authenticator, 'scheduleTokenRefresh');

          authenticator.callback();
        });

        afterEach(function () {
          clock.restore();
          authenticator.scheduleTokenRefresh.restore();
        });

        it("sets token_refresh_at in localStorage from result's expires_in", function () {
          expect(localStorage['token_refresh_at']).to.equal(expectedTokenRefreshAt.toString());
        });

        it('queues up a token refresh', function () {
          expect(authenticator.scheduleTokenRefresh.calledOnce).to.be.true;
          expect(authenticator.scheduleTokenRefresh.calledWithExactly(msTimeout)).to.be.true;
        });
      });

      it('returns the deferred object returned by OAuth', function() {
        var deferred = Ember.$.Deferred();

        //stub callback
        OAuth.callback = function(provider) {
          expect(provider).to.equal(authenticator.get('snowflake_provider'));
          return deferred;
        };

        var authenticator = this.subject();

        expect(authenticator.callback()).to.equal(deferred);
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
          sinon.stub(Ember.$, 'ajax').returns({ then: function () {} });
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
          expect(authenticator.authenticate.calledOnce).to.be.true;
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
  }
);
