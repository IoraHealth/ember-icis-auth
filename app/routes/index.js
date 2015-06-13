import Ember from 'ember';
import Index from 'ember-icis-auth/routes/index';
import ENV from '../config/environment';

var config = ENV['ember-icis-auth'];

export default Index.reopen({
  snowflake_provider: config.snowflakeProvider,
  snowflake_url: config.snowflakeUrl
});
