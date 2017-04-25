var VirtualModulesPlugin = require('webpack-virtual-modules');
var RawSource = require('webpack-sources').RawSource;
var ExtractGQL = require('persistgraphql/lib/src/ExtractGQL').ExtractGQL;
var path = require('path');
var addTypenameTransformer = require('persistgraphql/lib/src/queryTransformers').addTypenameTransformer;
var graphql = require('graphql');
var _ = require('lodash');

function PersistGraphQLPlugin(options) {
  this.options = options || {};
  if (!this.options.moduleName)
    throw new Error("moduleName option is required for PersistGraphQLPlugin");
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
    self.virtualModules.writeModule(self.options.moduleName, queryMap);
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

  if (!self.options.provider) {
    var hasPlaceholder = false;
  }
  compiler.plugin('after-resolvers', function() {
    compiler.resolvers.normal.plugin('before-resolve', function(request, callback) {
      var requestPath = path.resolve(path.join(request.path, request.request));
      if (requestPath.indexOf(self.options.moduleName) >= 0) {
        if (self.options.provider) {
          if (self._queryMap) {
            callback();
          } else {
            self._callback = callback;
          }
        } else {
          if (!hasPlaceholder) {
            self._queryMap = '{}';
            self.virtualModules.writeModule(self.options.moduleName, '{}');
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
          var extractor = new ExtractGQL({inputFilePath: '',
            queryTransformers: self.options.addTypename ? [function(doc) {
            return addTypenameTransformer(JSON.parse(JSON.stringify(doc)));
          }] : undefined});

          var doc = graphql.parse(graphQLString);
          var docMap = graphql.separateOperations(doc);
          var queries = {};
          Object.keys(docMap).forEach(function (operationName) {
            var document = docMap[operationName];
            var fragmentMap = {};
            for (var i = document.definitions.length - 1; i >= 0; i--) {
              var def = document.definitions[i];
              if (def.kind === 'FragmentDefinition') {
                if (!fragmentMap[def.name.value]) {
                  fragmentMap[def.name.value] = true;
                } else {
                  document.definitions.splice(i, 1);
                }
              }
            }
            queries = _.merge(queries, extractor.createMapFromDocument(document));
          });

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
          self.virtualModules.writeModule(self.options.moduleName, self._queryMap);
          compilation.modules.forEach(function(module) {
            if (module.resource === self.options.moduleName ||
              module.resource === path.resolve(path.join(compiler.context, self.options.moduleName))) {
              module._source._value = "module.exports = " + self._queryMap + ";";
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