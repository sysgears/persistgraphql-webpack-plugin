# PersistGraphQL Webpack Plugin

[![Build Status](https://travis-ci.org/sysgears/persistgraphql-webpack-plugin.svg?branch=master)](https://travis-ci.org/sysgears/persistgraphql-webpack-plugin)
[![Greenkeeper badge](https://badges.greenkeeper.io/sysgears/persistgraphql-webpack-plugin.svg)](https://greenkeeper.io/)

Webpack Plugin for working with Persisted GraphQL Queries with Hot Code Replacement support.

## Installation

```bash
npm install --save-dev persistgraphql-webpack-plugin
```

## Usage

### When Webpack is used for front-end only

Sample Webpack config:

```js
var PersistGraphQLPlugin = require('persistgraphql-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        // ...
        use: [
          'babel-loader', 
          'persistgraphql-webpack-plugin/js-loader' // Should come AFTER babel
        ]
      },
      {
        test: /\.(graphql|gql)$/,
        use: [
          'graphql-tag/loader', 
          'persistgraphql-webpack-plugin/graphql-loader' // Should come AFTER graphql-tag/loader
        ]
      },
    ]
  }
  
  plugins: [
    new PersistGraphQLPlugin({filename: 'persisted_queries.json'})
  ]
};
```

In the source code of front-end persisted GraphQL queries will be injected 
as a virtual module `persisted_queries.json`. This module will be updated if queries added or changed. Also asset with name
`persisted_queries.json` will be generated during compilation and written to output directory.

```js
var queryMap = require('persisted_queries.json');
console.log(queryMap);
```

### When Webpack is used both for back-end and front-end

```js
var PersistGraphQLPlugin = require('persistgraphql-webpack-plugin');

const frontendPersistPlugin = new PersistGraphQLPlugin();
const backendPersistPlugin = new PersistGraphQLPlugin({provider: clientPersistPlugin});

var frontendWebpackConfig = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        // ...
        use: [
          'babel-loader', 
          'persistgraphql-webpack-plugin/js-loader' // Should come AFTER babel
        ]
      },
      {
        test: /\.(graphql|gql)$/,
        use: [
          'graphql-tag/loader', 
          'persistgraphql-webpack-plugin/graphql-loader' // Should come AFTER graphql-tag/loader
        ]
      },
    ]
  }
  
  plugins: [
    frontendPersistPlugin
  ]
};

var backendWebpackConfig = {
  // ...
  plugins: [
    backendPersistPlugin
  ]
}
```

Both in the source code of front-end and back-end persisted GraphQL queries will be injected 
as a virtual module `persisted_queries.json`. This module will be updated if queries added or changed.

```js
var queryMap = require('persisted_queries.json');
console.log(queryMap);
```

## Options

```js
new PersistGraphQLPlugin(options: object)
```

|Name|Type|Description|
|:--:|:--:|:----------|
|**`filename`**|`{String}`|Name of the ouput file with persisted GraphQL queries|
|**`moduleName`**|`{String}`|Name of virtual wepback module with persisted GraphQL queries, `persisted_queries.json` by default|
|**`provider`**|`{Object}`|Instance of plugin running on another webpack instance which will provide persisted GraphQL queries|

## License
Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
