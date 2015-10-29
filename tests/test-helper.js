import resolver from './helpers/resolver';
import { setResolver } from 'ember-mocha';
import { afterEach } from 'mocha';
import sinon from 'sinon';

setResolver(resolver);

afterEach(function() {
  sinon.collection.restore();
});
