'use strict';

var webpack = require('webpack');
var assert = require('chai').assert;
var path = require('path');
var MemoryFileSystem = require('memory-fs');

var Plugin = require('../index');
var VirtualPlugin = require('webpack-virtual-modules');

var moduleName = path.resolve('node_modules/persisted_queries.json');

describe('persistgraphql-webpack-plugin', function() {
  it('should fail if moduleName not specified', function() {
    assert.throws(function() {
      new Plugin();
    });
  });

  it('should NOT fail if applied as plugin', function() {
    var plugin = new Plugin({ moduleName: moduleName });

    assert.doesNotThrow(function() {
      webpack({
        plugins: [plugin],
        entry: 'index.js'
      });
    });
  });

  it('should extract queries from js and graphql files', function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'require("./example.graphql");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName, addTypename: false });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.graphql$/,
            use: 'graphql-tag/loader'
          }
        ]
      },
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        JSON.stringify(eval(fs.readFileSync('/main.js').toString())),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":"3f99fddff5dfe1ff4984f400cf62662a391acb0812ff584e8080e9d489017e50","query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":"4722dce4b669412291b70e2bfd2d6471fd55e599775a44c1a2d2721352583733"}'
      );
      done();
    });
  });

  it('should generate counter ids when hashQuery is false', function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'require("./example.graphql");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName, addTypename: false, hashQuery: false });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.graphql$/,
            use: 'graphql-tag/loader'
          }
        ]
      },
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        JSON.stringify(eval(fs.readFileSync('/main.js').toString())),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":1,"query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":2}'
      );
      done();
    });
  });

  it('should extract queries from js and graphql files whe using graphql-persisted-document-loader', function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'require("./example.graphql");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName, addTypename: false });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.graphql$/,
            use: ['graphql-persisted-document-loader', 'graphql-tag/loader']
          }
        ]
      },
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        JSON.stringify(eval(fs.readFileSync('/main.js').toString())),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":"3f99fddff5dfe1ff4984f400cf62662a391acb0812ff584e8080e9d489017e50","query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":"4722dce4b669412291b70e2bfd2d6471fd55e599775a44c1a2d2721352583733"}'
      );
      done();
    });
  });

  it('should add typename to queries from js and graphql files', function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'require("./example.graphql");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var plugin = new Plugin({ moduleName: moduleName });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      module: {
        rules: [
          {
            test: /\.graphql$/,
            use: 'graphql-tag/loader'
          }
        ]
      },
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        JSON.stringify(eval(fs.readFileSync('/main.js').toString())),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n    __typename\\n  }\\n}\\n":"77e0699948d7649b55e17d763962810b9de6f60653321ef978f61814291b928e","query getCount {\\n  count {\\n    amount\\n    __typename\\n  }\\n}\\n":"91f7b17943cebb41bf6ef37793193211ff29fc7f0b397f33c1654f820c97cb45"}'
      );
      done();
    });
  });

  it('should extract queries from js files only into output json file', function(done) {
    var virtualPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n'
    });

    var plugin = new Plugin({
      moduleName: moduleName,
      filename: 'output_queries.json',
      addTypename: false
    });

    var compiler = webpack({
      plugins: [virtualPlugin, plugin],
      entry: './entry.js'
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        fs.readFileSync(path.resolve('output_queries.json')).toString(),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":"3f99fddff5dfe1ff4984f400cf62662a391acb0812ff584e8080e9d489017e50"}'
      );
      done();
    });
  });

  it('should receive queries from provider plugin', function(done) {
    var virtualProviderPlugin = new VirtualPlugin({
      'entry.js':
        'var gql = require("graphql-tag");\n' +
        'require("./example.graphql");\n' +
        'var query = gql`subscription onCounterUpdated { counterUpdated { amount } }`;\n' +
        'module.exports = require("persisted_queries.json");\n',
      'example.graphql': 'query getCount { count { amount } }'
    });

    var providerPlugin = new Plugin({ moduleName: moduleName, addTypename: false });
    var providerCompiler = webpack({
      plugins: [virtualProviderPlugin, providerPlugin],
      module: {
        rules: [
          {
            test: /\.graphql$/,
            use: 'graphql-tag/loader'
          }
        ]
      },
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    providerCompiler.outputFileSystem = new MemoryFileSystem();

    var compiler = webpack({
      plugins: [
        new VirtualPlugin({
          'entry.js': 'module.exports = require("persisted_queries.json");'
        }),
        new Plugin({
          moduleName: moduleName,
          addTypename: false,
          provider: providerPlugin
        })
      ],
      entry: './entry.js',
      output: {
        path: '/'
      }
    });

    compiler.outputFileSystem = new MemoryFileSystem();

    compiler.run(function() {
      var fs = compiler.outputFileSystem;
      assert.equal(
        JSON.stringify(eval(fs.readFileSync('/main.js').toString())),
        '{"subscription onCounterUpdated {\\n  counterUpdated {\\n    amount\\n  }\\n}\\n":"3f99fddff5dfe1ff4984f400cf62662a391acb0812ff584e8080e9d489017e50","query getCount {\\n  count {\\n    amount\\n  }\\n}\\n":"4722dce4b669412291b70e2bfd2d6471fd55e599775a44c1a2d2721352583733"}'
      );
      done();
    });

    providerCompiler.run(function() {});
  });
});
