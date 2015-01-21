import DS from 'ember-data';

export default DS.ActiveModelSerializer.extend({
  primaryKey: 'uid',
  extract: function(store, type, payload, id, requestType) {
    payload.id = 'me';

    var practiceUsers = payload.practice_users,
        practiceUserUids = [];

    practiceUsers.forEach(function(practiceUser) {
      practiceUserUids.push(practiceUser.uid)
    });

    payload.current_practice_user_uids = practiceUserUids;

    delete payload.practice_users;

    var newPayload = { 'current_user': payload, 'current_practice_users': practiceUsers };

    return this._super(store, type, newPayload, 'me', requestType);
  },

  keyForRelationship: function(key, relationship) {
    if (key === "currentPracticeUsers") {
      return "current_practice_user_uids";
    } else {
      return this._super(key, relationship);
    }
  }
});
