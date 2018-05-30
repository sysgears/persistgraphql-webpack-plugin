# PersistGraphQL Webpack Plugin

[![Build Status](https://travis-ci.org/sysgears/persistgraphql-webpack-plugin.svg?branch=master)](https://travis-ci.org/sysgears/persistgraphql-webpack-plugin)
[![Greenkeeper badge](https://badges.greenkeeper.io/sysgears/persistgraphql-webpack-plugin.svg)](https://greenkeeper.io/) [![Twitter Follow](https://img.shields.io/twitter/follow/sysgears.svg?style=social)](https://twitter.com/sysgears)

Webpack Plugin that gathers all the GraphQL queries/mutation/subscriptions both from `.graphql` files and from embedded queries in JavaScript/TypeScript source code. It generates `virtual` module `persisted_queries.json` with all the queries as a map object (query -> id) available for `require` from any place within source code and output file on file system with all the queries.

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
        test: /\.(graphql|gql)$/,
        use: 'graphql-tag/loader'
      },
    ]
  }

  plugins: [
    new PersistGraphQLPlugin({filename: 'persisted_queries.json',
        moduleName: path.resolve('node_modules/persisted_queries.json')})
  ]
};
```

In the source code of front-end persisted GraphQL queries will be injected
as a virtual module `persisted_queries.json`. This module will be updated
if queries added or changed. Also asset with name `persisted_queries.json` will be generated
during compilation and written to output directory.

```js
var queryMap = require('persisted_queries.json');
console.log(queryMap);
```

### When Webpack is used both for back-end and front-end

```js
var PersistGraphQLPlugin = require('persistgraphql-webpack-plugin');

const moduleName = path.resolve('node_modules/persisted_queries.json');
const frontendPersistPlugin = new PersistGraphQLPlugin({ moduleName });
const backendPersistPlugin =
    new PersistGraphQLPlugin({ provider: clientPersistPlugin, moduleName });

var frontendWebpackConfig = {
  module: {
    rules: [
      {
        test: /\.(graphql|gql)$/,
        use: 'graphql-tag/loader'
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
as a virtual module `node_modules/persisted_queries.json`. This module will be updated if queries added or changed.

```js
var queryMap = require('persisted_queries.json');
console.log(queryMap);
```

|Name|Type|Description|
|:--:|:--:|:----------|
|**`moduleName`**|`{String}`|Name of virtual wepback module with persisted GraphQL queries, this option is **required**|
|**`filename`**|`{String}`|Name of the ouput file with persisted GraphQL queries|
|**`addTypename`**|`{Boolean}`|Apply a query transformation to the query documents, adding the __typename field at every level of the query, default: `true`|
|**`hashQuery`**|`{Function}`|Function to hash queries in hash map, default: SHA-256 from query, if `false` passed - counter values are used|
|**`provider`**|`{Object}`|Instance of plugin running on another webpack instance which will provide persisted GraphQL queries|
|**`excludeRegex`**|`{RegExp}`|RegExp to match file path that will be excluded from processing by the plugin, default: `/[\\/]node_modules[\\/]/`|
|**`graphqlRegex`**|`{RegExp}`|RegExp to match files loaded by `graphql-tag/loader` that should be processed by the plugin, default: `/(.graphql\|.gql)$/`|
|**`jsRegex`**|`{RegExp}`|RegExp to match js files that have embedded GraphQL queries marked with `gql` tag, default: `/(.jsx?\|.tsx?)$/`|

## License
Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
