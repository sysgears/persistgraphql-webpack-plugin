var ExtractGQL = require("persistgraphql/lib/src/ExtractGQL").ExtractGQL;

module.exports = function(source, map) {
  var queries = new ExtractGQL({inputFilePath: this.resource})
    .createOutputMapFromString(source);
  if (Object.keys(queries).length) {
    this._module._graphQLQueries = queries;
  }
  this.callback(null, source, map);
};
