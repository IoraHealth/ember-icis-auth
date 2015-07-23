import { ActiveModelSerializer } from 'active-model-adapter';

export default ActiveModelSerializer.extend({
  primaryKey: 'uid',
  isNewSerializerAPI: true,
});
