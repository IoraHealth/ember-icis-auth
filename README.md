# ember-icis-auth

This Ember CLI addon gives you everything you need to start authenticating
against our identity service which will allow you access to our service layer
via CORS.

What this does for you:
* Gives you authentication via OAuth to our identity server, then sets an
access token so that our model layer can interact with our services.
* Provides a route ("/token") that can accept an access_token query parameter
that will also set your access token, skipping OAuth. The idea behind this is
that you are likely going to one of these applications from one that already has
a valid token.
* Provides current-user and current-practice-user models, which will get the ME
json from Snowflake and provide you with some necessary authentication information.

## Installation

```sh
npm install --save-dev ember-icis-auth
ember g ember-icis-auth
```

Set up the Snowflake OAuth provider configuration:

```javascript
// config/environment.js

if (environment == 'staging') {
  ENV.APP.SNOWFLAKE_URI = 'https://snowflake-staging.icisapp.com';
  ENV.APP.SNOWFLAKE_CLIENT_ID = '<app-client-id-here>';
}

// Repeat the above for each env, then at the end:

ENV.EmberENV['ember-oauth2'] = {
  snowflake: {
    clientId: ENV.APP.SNOWFLAKE_CLIENT_ID,
    authBaseUri: `${ENV.APP.SNOWFLAKE_URI}/oauth/authorize`,
    scope: 'user'
  }
};
```

Repeat this for each environment.

Create authenticator service, and optionally a test double service:

```javascript
// app/services/authenticator.js
import authenticator from 'ember-icis-auth/services/authenticator';
import config from 'notes-dash/config/environment';

export default authenticator.extend({
  snowflake_url: config.APP.SNOWFLAKE_URI
});

// app/services/test-authenticator.js
import authenticator from 'ember-icis-auth/services/test-authenticator';
import config from 'notes-dash/config/environment';

export default authenticator.extend({
  snowflake_url: config.APP.SNOWFLAKE_URI
});
```

Create an Authenticator initializer:

```javascript
// app/initializer/authenticator.js
import config from 'notes-dash/config/environment';

export function initialize(container, application) {
  var service;
  if (config.environment === 'test') {
    // use provided test double in test environment
    service = 'service:test-authenticator';
  } else {
    service = 'service:authenticator';
  }

  // injects dependency into all routes
  application.inject('route', 'authenticator', service);

  // Alternatively you can inject the authenticator into only routes which need
  // to access it, (for example the auth route, routes with include the
  // AuthenticatedRouteMixin, routes with custom auth logic):
  // application.inject('route:some-authenticated-route', 'authenticator', service);
}

export default {
  name: 'authenticator',
  initialize: initialize
};
```

Make the application authenticated:

```javascript
// app/routes/index.js
import AuthenticatedRouteMixin from 'ember-icis-auth/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  // ... route implementation as normal
});
```

Set up the store adapter for the current-user model:

```javascript
// app/adapters/current-user.js
import CurrentUser from 'ember-icis-auth/adapters/current-user';
import config from 'notes-dash/config/environment';

export default CurrentUser.reopen({
  host: config.APP.SNOWFLAKE_URI
});
```

And finally setup the basic routing:

```javascript
// app/router.js
Router.map(function() {
  this.route("token");
});
```

### Transitioning to other routes after auth

The default behavior in the token route transitions to the app's index after
successful authentication. You may wish to implement other logic, and the token
route makes it easy to do so using the transitionToTargetRoute callback.

```javascript
// app/routes/token.js
import Token from 'ember-icis-auth/routes/token'

export default Token.reopen({
  transitionToTargetRoute: function(transition) {
    console.log("We're authenticated now!");
    this._super(transition);
  }
});
```

## Running Tests

* `ember test`
* `ember test --server`

### Local development of addon

It's often easier to provide a local link to this library while developing a
widget. This is how you go about it.

In the CLI app you are building first lower the requirement for the widget lib:
```js
//package.json
"devDependencies": {
  //"ember-icis-auth": "~ 0.1.0"
  "ember-icis-auth": "*"
}
```

Next, in this directory link the local version into npm:
```sh
npm link
```

Then in the CLI directory, link the local version of this lib:
```sh
npm link ember-icis-auth
```
