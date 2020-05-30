# Plugin Options

## Table of Contents

- [url](#url-string)

- [verbose](#verbose-boolean)

- [debug](#debug-object)

  - [debug.graphql](#debug-graphql-object)
    - [debug.graphql.showQueryVarsOnError](#debug-graphql-show-query-vars-on-error-boolean)
    - [debug.graphql.panicOnError](#)
    - [debug.graphql.onlyReportCriticalErrors](#)
    - [debug.graphql.writeQueriesToDisk](#)

- [develop](#)
- [develop.nodeUpdateInterval](#)
  - [develop.hardCacheMediaFiles](#)
  
- [auth](#)

  - [auth.htaccess](#)
    - [auth.htaccess.username](#)
    - [password](#)

- [schema](#)

  - [schema.typePrefix](#)
  - [schema.timeout](#)
  - [schema.perPage](#)

- [excludeFieldNames](#)

- [html](#)

  - [html.useGatsbyImage](#)
  - [html.imageMaxWidth](#)
  - [html.fallbackImageMaxWidth](#)
  - [html.imageQuality](#)

- [type](#)

  - [type[TypeName].exclude](#)

  - [type[TypeName].excludeFieldNames](#)

  - [type.\_\_all](#)

  - [type.RootQuery](#)

  - [type.MediaItem.lazyNodes](#)

## url: String

This is the only plugin option which is required for the plugin to work properly.

This should be the full url of your GraphQL endpoint.

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {
    url: `https://yoursite.com/graphql`
  },
},
```

## verbose: Boolean

Wether there will be verbose output in the terminal. Set true for verbose. Default is `false`.

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {
		verbose: true,
  },
},
```

## debug: Object

An object which contains options related to debugging. See below for options.

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {
  	debug: {
			// debugging settings
    }
  },
},
```

### debug.graphql: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### debug.graphql.showQueryVarsOnError: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### debug.graphql.panicOnError: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### debug.graphql.onlyReportCriticalErrors: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### debug.graphql.writeQueriesToDisk: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## develop: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### develop.nodeUpdateInterval: Int

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

Specifies in milliseconds how often Gatsby will ask WP what data has changed during development. If you want to see data update in near-realtime while you're developing, set this low. Your server may have trouble responding to too many requests over a long period of time and in that case, set this high. Setting it higher saves electricity too ⚡️🌲

### develop.hardCacheMediaFiles: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## auth: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### auth.htaccess: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### auth.htaccess.username: String

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

#### auth.htaccess.password: String

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## schema: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### schema.typePrefix: String

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### schema.timeout: Int

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### schema.perPage: Int

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## excludeFieldNames: Array

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## html: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### html.useGatsbyImage: true

this causes the source plugin to find/replace images in html

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### html.imageMaxWidth: Boolean

this adds a limit to the max width an image can be
if the image selected in WP is smaller or the image is smaller than this
those values will be used instead.

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### html.fallbackImageMaxWidth: Int

if a max width can't be inferred from html this value will be passed to Sharp

if the image is smaller than this the images width will be used instead

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### html.imageQuality: Int

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

## type: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### type[TypeName].exclude: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### type[TypeName].excludeFieldNames: Array

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### type.\_\_all: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### type.RootQuery: Object

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

### type.MediaItem.lazyNodes: Boolean

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
	options: {

  },
},
```

# Up Next :point_right:

- :boat: [Migrating from other WP source plugins](./migrating-from-other-wp-source-plugins.md)
- :house: [Hosting](./hosting.md)
- :athletic_shoe: [Themes, Starters, and Examples](./themes-starters-examples.md)
- :medal_sports: [Usage with popular WPGraphQL extensions](./usage-with-popular-wp-graphql-extensions.md)
- :gear: [How does this plugin work?](./how-does-this-plugin-work.md)
- :hammer_and_wrench: [Debugging and troubleshooting](./debugging-and-troubleshooting.md)
- :national_park: [Community and Support](./community-and-support.md)
- :point_left: [Back to README.md](../README.md)
