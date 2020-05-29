# gatsby-source-wordpress-experimental

This plugin is the beta release of `gatsby-source-wordpress@v4`. It is rewritten from the ground up using WPGraphQL for data sourcing.
This is the officially recommended way to use WordPress with Gatsby. It is currently being published on a separate package to make migrating from `gatsby-source-wordpress@v3` easier. This allows you to activate this new version of the plugin alongside `gatsby-source-wordpress` and migrate your codebase one piece at a time.

This plugin works by merging the [WPGraphQL schema / data](https://docs.wpgraphql.com/guides/about-wpgraphql/) with the [Gatsby schema / Node model](https://www.gatsbyjs.org/docs/node-model/) which allows us to efficiently cache WP data in Gatsby. This makes incremental builds and Preview work and provides an improved developer experience over previous ways of using Gatsby and WP together.



<p align="center">
  <a href="https://github.com/gatsbyjs/gatsby/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Gatsby is released under the MIT license." />
  </a>
  <a href="https://circleci.com/gh/gatsbyjs/gatsby">
    <img src="https://circleci.com/gh/gatsbyjs/gatsby.svg?style=shield" alt="Current CircleCI build status." />
  </a>
  <a href="https://www.npmjs.org/package/gatsby">
    <img src="https://img.shields.io/npm/v/gatsby.svg" alt="Current npm package version." />
  </a>
  <a href="https://npmcharts.com/compare/gatsby?minimal=true">
    <img src="https://img.shields.io/npm/dm/gatsby.svg" alt="Downloads per month on npm." />
  </a>
  <a href="https://npmcharts.com/compare/gatsby?minimal=true">
    <img src="https://img.shields.io/npm/dt/gatsby.svg" alt="Total downloads on npm." />
  </a>
  <a href="https://gatsbyjs.org/contributing/how-to-contribute/">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=gatsbyjs">
    <img src="https://img.shields.io/twitter/follow/gatsbyjs.svg?label=Follow%20@gatsbyjs" alt="Follow @gatsbyjs" />
  </a>
</p>

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

  

