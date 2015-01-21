import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  PATH: 'me.json',
  host: 'CHANGEME',
  namespace: 'api/v1',
  token: localStorage['access_token'],

  buildURL: function() {
    return this.host + '/' + this.namespace + '/' +
      this.PATH + '?access_token=' + this.get('token');
  }
});
