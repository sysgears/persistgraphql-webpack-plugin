var VirtualModulesPlugin = require('webpack-virtual-modules');
var OriginalSource = require('webpack-sources').OriginalSource;
var RawSource = require('webpack-sources').RawSource;
var ExtractGQL = require('persistgraphql/lib/src/ExtractGQL').ExtractGQL;
var path = require('path');
var addTypenameTransformer = require('persistgraphql/lib/src/queryTransformers').addTypenameTransformer;

function PersistGraphQLPlugin(options) {
  this.options = options || {};
  if (this.options.provider) {
    this.options.provider._addListener(this);
  } else {
    this._listeners = [];
  }
  this.virtualModules = new VirtualModulesPlugin();
}

PersistGraphQLPlugin.prototype._addListener = function(listener) {
  this._listeners.push(listener);
};

PersistGraphQLPlugin.prototype._notify = function(queryMap) {
  var self = this;

  if (self._queryMap !== queryMap) {
    self.virtualModules.writeModule(self.modulePath, queryMap);
  }
  self._queryMap = queryMap;
  if (self._callback) {
    self._callback();
    delete self._callback;
  }
};

PersistGraphQLPlugin.prototype.apply = function(compiler) {
  var self = this;

  self.virtualModules.apply(compiler);
  self._compiler = compiler;
  var moduleName = self.options.moduleName || 'persisted_queries.json';
  self.modulePath = path.join('node_modules', moduleName);

  if (!self.options.provider) {
    var hasPlaceholder = false;
  }
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
          if (!hasPlaceholder) {
            self._queryMap = '{}';
            self.virtualModules.writeModule(self.modulePath, '{}');
            hasPlaceholder = true;
          }
          callback();
        }
      } else {
        callback();
      }
    });
  });

  if (!self.options.provider) {
    compiler.plugin('compilation', function(compilation) {
      compilation.plugin('seal', function() {
        var graphQLString = '';
        var allQueries = [];
        compilation.modules.forEach(function(module) {
          var queries = module._graphQLQueries;
          if (queries) {
            Object.keys(queries).forEach(function(query) {
              allQueries.push(query);
            });
          } else if (module._graphQLString) {
            graphQLString += module._graphQLString;
          }
        });

        if (graphQLString) {
          var queries = new ExtractGQL({inputFilePath: '',
            queryTransformers: self.options.addTypename ? [addTypenameTransformer] : undefined})
            .createOutputMapFromString(graphQLString);
          Object.keys(queries).forEach(function(query) {
            allQueries.push(query);
          });
        }

        var mapObj = {};
        var id = 1;

        allQueries.sort().forEach(function(query) {
          mapObj[query] = id++;
        });

        var newQueryMap = JSON.stringify(mapObj);
        if (newQueryMap !== self._queryMap) {
          self._queryMap = newQueryMap;
          self.virtualModules.writeModule(self.modulePath, self._queryMap);
          compilation.modules.forEach(function(module) {
            if (module.resource === path.join(compiler.context, self.modulePath)) {
              module._source = new OriginalSource("module.exports = " + self._queryMap + ";", module.resource);
            }
          });
        }
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