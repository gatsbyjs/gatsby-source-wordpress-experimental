**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/features/compatibility-api.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜

# Compatibility API

Because we have so many remote depencies (WordPress, WPGraphQL, and WPGatsby), we've baked a remote compatibility API into this plugin.

Anytime the build or develop process starts, the source plugin will send the WPGatsby and WPGraphQL semver version ranges it supports to WPGatsby. WPGatsby will return wether or not the currently installed plugins are within the supported range.

If your dependencies are out of the supported range, the build process will exit and provide a link to download the correct dependency versions.

:point_left: [Back to Features](./index.md)
