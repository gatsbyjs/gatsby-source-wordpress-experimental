## Installation / Getting Started

- [Install, node, npm/yarn, Gatsby, and gatsby-cli](https://www.gatsbyjs.org/docs/)
- Set up the starter locally `gatsby new wordpress-gatsby https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental`
- In the `WordPress/plugins/` directory of [the starter](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins) there are two plugins which both need to be installed into a live WordPress instance
  - [WPGraphQL](https://github.com/wp-graphql/wp-graphql) - this adds GraphQL to our WordPress server
  - [WPGatsby](https://github.com/gatsbyjs/wp-gatsby) - this modifies the WPGQL schema and records when user actions have happened to allow us to do selective cache invalidation in Gatsby (to speed up builds) and add Preview support.
- In the `gatsby-config.js` of the starter you just set up, update the plugin options for `gatsby-source-wordpress-experimental`. Change the `url` option so that it points to your WordPress instance GraphQL url. This should be the full url of your GraphQL endpoint. Eg `https://yoursite.com/graphql`
