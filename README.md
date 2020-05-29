# gatsby-source-wordpress-experimental

This plugin is a pre-release experimental version of the upcoming gatsby-source-wordpress V4. It is rewritten from the ground up using WPGraphQL for data sourcing as well as a custom plugin WPGatsby to transform the WPGraphQL schema in Gatsby-specific ways.

This plugin works by merging the [WPGraphQL schema / data](https://docs.wpgraphql.com/guides/about-wpgraphql/) with the [Gatsby schema / Node model](https://www.gatsbyjs.org/docs/node-model/) which allows us to efficiently cache WP data in Gatsby. This makes incremental builds and Preview work.

## Installation / Getting Started

- [Install Gatsby and gatsby-cli](https://www.gatsbyjs.org/docs/)
- Set up the starter locally `gatsby new wordpress-gatsby https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental`
- In the `WordPress/plugins/` directory of [the starter](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins) there are two plugins which both need to be installed into a live WordPress instance
  - [WPGraphQL](https://github.com/wp-graphql/wp-graphql) - this adds GraphQL to our WordPress server
  - [WPGatsby](https://github.com/gatsbyjs/wp-gatsby) - this modifies the WPGQL schema and records when user actions have happened to allow us to do selective cache invalidation in Gatsby (to speed up builds) and add Preview support.
- In the `gatsby-config.js` of the starter you just set up, update the plugin options for `gatsby-source-wordpress-experimental`. Change the `url` option so that it points to your WordPress instance GraphQL url. This should be the full url of your GraphQL endpoint. Eg `https://yoursite.com/graphql`

## Table of Contents

- [Notable features](./docs/features.md)
- [Plugin options](./docs/plugin-options.md)
- [Debugging and troubleshooting](./docs/debugging-and-troubleshooting.md)

## Relevant Links

- [Changelog](./CHANGELOG.md)
- [Starter](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental)
- [WPGatsby](https://github.com/gatsbyjs/wp-gatsby)
- [WPGraphQL](https://github.com/wp-graphql/wp-graphql)
- [GatsbyWPThemes](https://gatsbywpthemes.com/)
