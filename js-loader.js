var ExtractFromJs = require("persistgraphql/lib/src/extractFromJS");

module.exports = function(source, map) {
  var callback = this.async();
  this.cacheable();

  try {
    var literalContents = ExtractFromJs.findTaggedTemplateLiteralsInJS(source, 'gql');
    var queries = {};
    var queryList = literalContents.map(ExtractFromJs.eliminateInterpolations);
    for (var i = 0; i < queryList.length; i++) {
      queries[queryList[i]] = i;
    }
    if (queryList.length) {
      this._module._graphQLQueries = queries;
    }
    callback(null, source, map);
  } catch (e) {
    callback(e);
  }
};
