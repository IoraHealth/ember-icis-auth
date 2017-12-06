import DS from 'ember-data';

export default DS.Model.extend({
  uid: DS.attr('string'),
  default: DS.attr('boolean'),
  practiceUid: DS.attr('string'),
  role: DS.attr('string'),
  signable: DS.attr('boolean'),

  isProvider: function() {
    return this.get('role') === 'Provider';
  }.property('role')
});
