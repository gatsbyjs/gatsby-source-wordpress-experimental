# gatsby-source-wordpress-experimental

This plugin is a pre-release experimental version of the upcoming gatsby-source-wordpress V4. It is rewritten from the ground up using WPGraphQL for data sourcing as well as a custom plugin WPGatsby to transform the WPGraphQL schema in Gatsby-specific ways.

This plugin works by merging the [WPGraphQL schema / data](https://docs.wpgraphql.com/guides/about-wpgraphql/) with the [Gatsby schema / Node model](https://www.gatsbyjs.org/docs/node-model/) which allows us to efficiently cache WP data in Gatsby. This makes incremental builds and Preview work and provides an improved developer experience over previous ways of using Gatsby and WP together.

## Docs

- [Installation & getting started](./docs/getting-started.md)
- [Notable features](./docs/features.md)
- [Plugin options](./docs/plugin-options.md)
- [Debugging and troubleshooting](./docs/debugging-and-troubleshooting.md)

## Relevant Links

- [Changelog](./CHANGELOG.md)
- [Starter](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental)
- [WPGatsby](https://github.com/gatsbyjs/wp-gatsby)
- [WPGraphQL](https://github.com/wp-graphql/wp-graphql)
- [GatsbyWPThemes](https://gatsbywpthemes.com/)
