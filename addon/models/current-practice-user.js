import DS from 'ember-data';

export default DS.Model.extend({
  default: DS.attr('boolean'),
  practiceId: DS.attr('number'),
  role: DS.attr('string'),
  signable: DS.attr('boolean'),

  isProvider: function() {
    return this.get('role') === 'Provider';
  }.property('role')
});
