module.exports = function(source, map) {
  var callback = this.async();
  this.cacheable();

  this._module._graphQLString = source;

  callback(null, source, map);
};
