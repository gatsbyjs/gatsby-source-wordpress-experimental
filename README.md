# gatsby-source-wordpress-experimental

This plugin is the beta release of `gatsby-source-wordpress@v4`. It is rewritten from the ground up using WPGraphQL for data sourcing.
This is the officially recommended way to use WordPress with Gatsby. It is currently being published on a separate package to make migrating from `gatsby-source-wordpress@v3` easier. This allows you to activate this new version of the plugin alongside `gatsby-source-wordpress` and migrate your codebase one piece at a time.

This plugin works by merging the [WPGraphQL schema / data](https://docs.wpgraphql.com/guides/about-wpgraphql/) with the [Gatsby schema / Node model](https://www.gatsbyjs.org/docs/node-model/) which allows us to efficiently cache WP data in Gatsby. This makes incremental builds and Preview work and provides an improved developer experience over previous ways of using Gatsby and WP together.



# Docs

- [Why use this plugin?](./docs/why-use-this-plugin.md)
- [Installation & getting started](./docs/getting-started.md)
- [Notable features](./docs/features.md)
- @todo Tutorials
- [Plugin options](./docs/plugin-options.md)
- @todo Migrating from other WP source plugins
- @todo Hosting
- [Themes, Starters, and Examples](./docs/themes-starters-examples.md)
- @todo Usage with popular WPGraphQL extensions
- @todo How does this plugin work?
- [Debugging and troubleshooting](./docs/debugging-and-troubleshooting.md)

## Relevant Links

- [Changelog](./CHANGELOG.md)

- [WPGatsby](https://github.com/gatsbyjs/wp-gatsby)

- [WPGraphQL](https://github.com/wp-graphql/wp-graphql)

- [Gatsby](https://www.gatsbyjs.org/)

- [WordPress](https://wordpress.org/)

  

