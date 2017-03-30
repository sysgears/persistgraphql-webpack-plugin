var OverlayModulesPlugin = require('webpack-overlay-modules');
var RawSource = require("webpack-sources").RawSource;

function PersistGraphQLPlugin(options) {
  this.options = options || {};
  if (this.options.provider) {
    this.options.provider._addListener(this);
  } else {
    this._listeners = [];
  }
  this.overlayModules = new OverlayModulesPlugin();
}

PersistGraphQLPlugin.prototype._addListener = function(listener) {
  this._listeners.push(listener);
};

PersistGraphQLPlugin.prototype._notify = function(queryMap) {
  var self = this;

  self.overlayModules.writeModule(self.modulePath, queryMap);
  self._queryMap = queryMap;
  if (self._callback) {
    self._callback();
    delete self._callback;
  }
};

PersistGraphQLPlugin.prototype.jsLoader = function() {
  return require.resolve('./js-loader');
};

PersistGraphQLPlugin.prototype.graphqlLoader = function() {
  return require.resolve('./graphql-loader');
};

  PersistGraphQLPlugin.prototype.apply = function(compiler) {
  var self = this;

  self.overlayModules.apply(compiler);
  self._compiler = compiler;
  var moduleName = self.options.moduleName || 'persisted_queries';
  self.modulePath = 'node_modules/' + moduleName + '.json';

  var queryMapNeeded = false;

  compiler.plugin('after-resolvers', function() {
    compiler.resolvers.normal.plugin('before-resolve', function(request, callback) {
      if (request.request.indexOf(moduleName) >= 0) {
        if (self.options.provider) {
          if (self._queryMap) {
            callback();
          } else {
            self._callback = callback;
          }
        } else {
          if (!queryMapNeeded) {
            self.overlayModules.writeModule(self.modulePath, '{}');
            queryMapNeeded = true;
          }
          if (callback)
            callback();
        }
      } else {
        if (callback)
          callback();
      }
    });
  });

  if (!self.options.provider) {
    compiler.plugin('compilation', function(compilation) {
      queryMapNeeded = false;
      compilation.plugin('seal', function() {
        if (queryMapNeeded) {
          var id = 1;
          var mapObj = {};
          compilation.modules.forEach(function(module) {
            var queries = module._graphQLQueries;
            if (queries) {
              Object.keys(queries).forEach(function(query) {
                mapObj[query] = id++;
              });
            }
          });
          self._queryMap = JSON.stringify(mapObj);
        } else {
          self._queryMap = "{}";
        }
        self.overlayModules.writeModule(self.modulePath, "module.exports = " + JSON.stringify(self._queryMap));
        self._listeners.forEach(function(listener) { listener._notify(self._queryMap); });
      });
    });
  }
  if (self.options.filename) {
    compiler.plugin('after-compile', function(compilation, callback) {
      compilation.assets[self.options.filename] = new RawSource(self._queryMap);
      callback();
    });
  }
};

module.exports = PersistGraphQLPlugin;