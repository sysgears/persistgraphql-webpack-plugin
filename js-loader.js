var ExtractFromJs = require("persistgraphql/lib/src/extractFromJS");

module.exports = function(source, map) {
  this.cacheable();

  var literalContents = ExtractFromJs.findTaggedTemplateLiteralsInJS(source, 'gql');
  var queries = {};
  var queryList = literalContents.map(ExtractFromJs.eliminateInterpolations);
  for (var i = 0; i < queryList.length; i++) {
    queries[queryList[i]] = i;
  }
  if (queryList.length) {
    this._module._graphQLQueries = queries;
  }
  this.callback(null, source, map);
};
