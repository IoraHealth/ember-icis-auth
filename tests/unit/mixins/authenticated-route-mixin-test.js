/* jshint expr:true */
import { expect } from 'chai';
import {
  describe,
  it,
  beforeEach
} from 'mocha';
import Ember from 'ember';
import AuthenticatedRouteMixinMixin from 'ember-icis-auth/mixins/authenticated-route-mixin';
import sinon from 'sinon';

describe('AuthenticatedRouteMixinMixin', function() {
  describe('#beforeModel', function() {
    beforeEach(function() {
      this.authenticatedRoute = Ember.Object.extend(AuthenticatedRouteMixinMixin, {
        _super: function() {}
      }).create({token: 'bogus'});

      this.superStub = sinon.collection.stub(this.authenticatedRoute, '_super');

      sinon.collection.stub(this.authenticatedRoute, 'findCurrentUser');
    });


    describe('when passed a queryParam containing access token', function() {
      beforeEach(function() {
        this.transition = {
          queryParams: {
            access_token: 'new access token'
          }
        };

        localStorage['access_token'] = 'bogus';
      });

      it('sets the localStorage access_token value', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(localStorage['access_token']).to.
          equal(this.transition.queryParams.access_token);
      });

      it('sets the token property', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(this.authenticatedRoute.get('token')).to.
          equal(this.transition.queryParams.access_token);
      });

      it('calls super and passes it the transition', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(this.superStub.calledWith(this.transition)).to.be.true;
      });
    });

    describe('when not passed a queryParam containing access token', function() {
      beforeEach(function() {
        this.transition = {};

        localStorage['access_token'] = 'bogus';
      });

      it('leaves the localStorage access_token value unchanges', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(localStorage['access_token']).to.equal('bogus');
      });

      it('does not change the token property', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(this.authenticatedRoute.get('token')).to.equal('bogus');
      });

      it('calls super and passes it the transition', function() {
        this.authenticatedRoute.beforeModel(this.transition);

        expect(this.superStub.calledWith(this.transition)).to.be.true;
      });

    });
  });
});
