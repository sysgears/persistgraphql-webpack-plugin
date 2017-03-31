"use strict";

var webpack = require("webpack");
var assert = require("chai").assert;
var path = require("path");
var MemoryFileSystem = require("memory-fs");

var Plugin = require("../index");
var VirtualPlugin = require("webpack-virtual-modules");

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

  it("should extract queries from js and graphql files", function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js': 'var gql = require("graphql-tag");\n' +
                  'require("./example.graphql");\n' +
                  'require("persisted_queries.json");\n' +
                  'var query = gql`countUpdated { amount }`;',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({filename: 'output_queries.json'});

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'js-loader'
          },
          {
            test: /\.graphql$/,
            use: 'graphql-loader'
          }
        ]
      },
      resolveLoader: {
        alias: {
          'graphql-loader': path.resolve(path.join(__dirname, '../graphql-loader.js')),
          'js-loader': path.resolve(path.join(__dirname, '../js-loader.js'))
        }
      },
      entry: './entry.js'
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(fs.readFileSync(path.resolve('output_queries.json')).toString(),
        '{"countUpdated { amount }":1,"query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":2}');
      done();
    });
  });
});