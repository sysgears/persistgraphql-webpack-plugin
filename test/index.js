"use strict";

var webpack = require("webpack");
var assert = require("chai").assert;
var path = require("path");
var MemoryFileSystem = require("memory-fs");

var Plugin = require("../index");
var VirtualPlugin = require("webpack-virtual-modules");

var moduleName = path.resolve('node_modules/persisted_queries.json');

describe("persistgraphql-webpack-plugin", function() {
  it("should fail if moduleName not specified", function() {
    assert.throws(function() {
      new Plugin()
    });
  });

  it("should NOT fail if applied as plugin", function() {
    var plugin = new Plugin({ moduleName: moduleName });

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
                  'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName, filename: 'output_queries.json' });

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
      assert.equal(
        fs.readFileSync(path.resolve('output_queries.json')).toString(),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":1,"query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":2}'
      );
      done();
    });
  });

  it("should add typename to queries from js and graphql files", function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js': 'var gql = require("graphql-tag");\n' +
      'require("./example.graphql");\n' +
      'require("persisted_queries.json");\n' +
      'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName, filename: 'output_queries.json', addTypename: true });

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
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n    __typename\\n  }\\n}\\n":1,"query getCount {\\n  count {\\n    amount\\n    __typename\\n  }\\n}\\n":2}');
      done();
    });
  });

  it("should extract queries from js files only", function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js': 'var gql = require("graphql-tag");\n' +
                  'require("persisted_queries.json");\n' +
                  'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;'
    });

    var plugin = new Plugin({ moduleName: moduleName, filename: 'output_queries.json' });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.js$/,
            use: 'js-loader'
          }
        ]
      },
      resolveLoader: {
        alias: {
          'js-loader': path.resolve(path.join(__dirname, '../js-loader.js'))
        }
      },
      entry: './entry.js'
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(fs.readFileSync(path.resolve('output_queries.json')).toString(),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":1}');
      done();
    });
  });

  it("should receive queries from provider plugin", function(done) {
    var virtualProviderPlugin = new VirtualPlugin({
      'entry.js': 'var gql = require("graphql-tag");\n' +
                  'require("./example.graphql");\n' +
                  'require("persisted_queries.json");\n' +
                  'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var providerPlugin = new Plugin({ moduleName: moduleName });
    var providerCompiler = webpack({
      plugins: [virtualProviderPlugin, providerPlugin],
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

    providerCompiler.outputFileSystem = new MemoryFileSystem();

    var compiler = webpack({
      plugins: [
        new VirtualPlugin({
          'entry.js': 'require("persisted_queries.json");'
        }),
        new Plugin({
          moduleName: moduleName,
          filename: 'output_queries.json',
          provider: providerPlugin
        })
      ],
      entry: './entry.js'
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(fs.readFileSync(path.resolve('output_queries.json')).toString(),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":1,"query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":2}');
      done();
    });

    providerCompiler.run(function() {});
  });
});