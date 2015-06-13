import Ember from 'ember';
import Auth from 'ember-icis-auth/routes/auth';
import ENV from '../config/environment';

var config = ENV['ember-icis-auth'];

export default Auth.reopen({
  snowflake_provider: config.snowflakeProvider
});

export default Auth;
