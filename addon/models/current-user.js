import DS from 'ember-data';

export default DS.Model.extend({
  uid: DS.attr('string'),
  currentPracticeUsers: DS.hasMany('currentPracticeUser', { async: false }),
  access_roles: DS.attr(),
  current_practice_user_uid: DS.attr('string'),

  practiceUser: function(uid) {
    return this.get('currentPracticeUsers').findBy('uid', uid);
  },

  currentPracticeUser: function() {
    let uid = this.get('current_practice_user_uid');
    return this.practiceUser(uid);
  }.property('current_practice_user_uid'),

  practiceUserByPracticeUid: function(practiceUid) {
    return this.get('currentPracticeUsers').findBy('practiceUid', practiceUid);
  },

  defaultPracticeUser: function() {
    return this.get('currentPracticeUsers').findBy('default', true);
  }.property('currentPracticeUsers.@each.default'),

  isAdminOrDeveloper: function() {
    var roles = this.get('access_roles');

    return roles.contains('admin') || roles.contains('developer');
  }.property('access_roles')
});
