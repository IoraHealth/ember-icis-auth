import DS from 'ember-data';

export default DS.Model.extend({
  uid: DS.attr('string'),
  currentPracticeUsers: DS.hasMany('currentPracticeUser'),
  access_roles: DS.attr(),

  practiceUser: function(uid) {
    return this.get('currentPracticeUsers').findBy('id', uid);
  },

  practiceUserByPracticeId: function(practiceId) {
    return this.get('currentPracticeUsers').findBy('practiceId', parseInt(practiceId, 10));
  },

  defaultPracticeUser: function() {
    return this.get('currentPracticeUsers').findBy('default', true);
  }.property('currentPracticeUsers.@each.default'),

  isAdminOrDeveloper: function() {
    var roles = this.get('access_roles');

    return roles.contains('admin') || roles.contains('developer');
  }.property('access_roles')
});
