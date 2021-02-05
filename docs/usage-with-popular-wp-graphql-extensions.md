**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/usage-with-popular-wp-graphql-extensions.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜



# Usage with popular WPGraphQL extensions

An ideal for this source plugin is for any WPGraphQL extension to become a Gatsby plugin. In practise we haven't yet had time to thoroughly test that all extensions work.

Below is a list of "Confirmed" and "Unconfirmed" extensions.

Confirmed simply means we've installed it and tried sourcing the data and it worked! All of the confirmed extensions are being used in this source plugin in production sites. The unconfirmed extensions simply haven't been fully tested and may or may not work.

If you find a bug when using an extension please open an issue and let us know.

## Confirmed Extensions

- [WPGraphQL for Advanced Custom Fields](https://www.wpgraphql.com/acf/)
- [WPGraphQL Yoast SEO](https://github.com/ashhitch/wp-graphql-yoast-seo)
- [WPGraphQL Polylang](https://github.com/valu-digital/wp-graphql-polylang)
- [WPGraphQL for Custom Post Type UI](https://github.com/wp-graphql/wp-graphql-custom-post-type-ui)
- [Add yours to this list!](https://github.com/gatsbyjs/gatsby-source-wordpress-experimental/edit/master/docs/usage-with-popular-wp-graphql-extensions.md)

## Unconfirmed Extensions (might still work but will have problems)

- [WPGraphQL WooCommerce](https://woographql.com/)
- [WPGraphQL Gutenberg](https://wp-graphql-gutenberg.netlify.app/)

# Up Next :point_right:

- :hammer_and_wrench: [Debugging and troubleshooting](./debugging-and-troubleshooting.md)
- :national_park: [Community and Support](./community-and-support.md)
- :point_left: [Back to README.md](../README.md)
