module.exports = function(source, map) {
  this.cacheable();

  this._module._graphQLString = source;

  this.callback(null, source, map);
};
