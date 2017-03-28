"use strict";

var webpack = require("webpack");
var assert = require("chai").assert;

var Plugin = require("../src/index");

describe("persistgraphql-webpack-plugin", function() {
  it("should NOT fail if applied as plugin", function() {
    var plugin = new Plugin();

    assert.doesNotThrow(function() {
      webpack({
        plugins: [plugin],
        entry: 'index.js'
      });
    });
  });
});