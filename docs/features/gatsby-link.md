**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/features/gatsby-link.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜

# Gatsby Link

Anchor tag src's in html that are links to your WP instance are automatically rewritten to relative links (`https://yoursite.com/beautiful-page` becomes `/beautiful-page`). For this reason, it's recommended to use your WordPress page and post [uri's](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/blob/master/gatsby-node.js#L29) to create your [Gatsby page paths](https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/blob/master/gatsby-node.js#L68).

Anchor tags in html that are relative links automatically become `gatsby-link`'s so that navigation via html links are blazing fast.

:point_left: [Back to Features](./index.md)
