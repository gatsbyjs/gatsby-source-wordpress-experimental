## Installation / Getting Started

- [Install Node, Gatsby, and gatsby-cli](https://www.gatsbyjs.org/docs/)
- Set up the starter locally `gatsby new wordpress-gatsby https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental`
- In the `WordPress/plugins/` directory of [the starter](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins) there are two plugins which both need to be installed into a live WordPress instance
  - [WPGraphQL](https://github.com/wp-graphql/wp-graphql)
  - [WPGatsby](https://github.com/gatsbyjs/wp-gatsby)
- In the `gatsby-config.js` of the starter you just set up, update the plugin options for `gatsby-source-wordpress-experimental`. Change the `url` option so that it points to your WordPress instance GraphQL url. This should be the full url of your GraphQL endpoint. Eg `https://yoursite.com/graphql`

## Dependencies

### WPGraphQL

This plugin turns our WordPress instance into a GraphQL server.

- [Github](https://github.com/wp-graphql/wp-graphql)
- [Docs](https://docs.wpgraphql.com/)
- [Website](https://www.wpgraphql.com/)

### WPGatsby

This plugin modifies the WPGraphQL schema and records when user actions have happened. This allows us to do selective cache invalidation in Gatsby (to speed up builds) and add Preview support.

- [Github](https://github.com/gatsbyjs/wp-gatsby)

## Up Next

- [Notable features](./features.md)
- [Plugin options](./plugin-options.md)
- [Debugging and troubleshooting](./debugging-and-troubleshooting.md)
- [Back to README.md for more](../README.md)
