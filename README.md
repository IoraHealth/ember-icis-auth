# Ember-icis-auth

This Ember CLI addon gives you everything you need to start authenticating
against our identity service which will allow you access to our service layer
via CORS.

What this does for you:
* Gives you authentication via OAuth-js to our identity server, then sets an
access token so that our model layer can interact with our services.
* Provides a route ("/token") that can accept an access_token query parameter
that will also set your access token, skipping OAuth. The idea behind this is
that you are likely going to one of these applications from one that already has
a valid token.

## Installation

```sh
npm install --save-dev ember-icis-auth
ember g ember-icis-auth
```

Then modify your Brocfile.js to add this:
```js
//Brocfile.js
app.import('bower_components/oauth-js/dist/oauth.js');
```

Create an OAuth initializer:
```js
//app/initializers/oauth.js
import config from 'notes-dash/config/environment';

export default {
  name: 'notes-dash',
  initialize: function() {
    OAuth.initialize(config.APP.OAUTHD_KEY);
    OAuth.setOAuthdURL(config.APP.OAUTHD_URL);
  }
};
```

Set the specific route configs:
```js
//app/routes/index.js
import config from 'notes-dash/config/environment';
import Index from 'ember-icis-auth/routes/index';

export default Index.reopen({
  snowflake_provider: config.APP.SNOWFLAKE_PROVIDER,
  snowflake_url: config.APP.SNOWFLAKE_URI
});

//app/routes/auth.js
import Auth from 'ember-icis-auth/routes/auth'
import config from 'notes-dash/config/environment'

export default Auth.reopen({
  snowflake_provider: config.APP.SNOWFLAKE_PROVIDER
});
```

And finally setup the basic routing:
```js
//app/router.js
Router.map(function() {
  this.route("auth");
  this.route("token");
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
