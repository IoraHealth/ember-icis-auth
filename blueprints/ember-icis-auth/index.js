var fs = require('fs');
var path = require('path');
var bowerFilePath, bowerFile;

module.exports = {

  normalizeEntityName: function() {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function() {
   bowerFilePath = path.join(this.project.root, 'bower.json');
   bowerFile = require(bowerFilePath);
   bowerFile.dependencies["oauth-js"] = "patricksrobertson/oauth-js#1.0.0";
   return fs.writeFileSync(bowerFilePath, JSON.stringify(bowerFile, null, 2));
  }
};
