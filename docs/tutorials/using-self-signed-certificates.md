**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/tutorials/using-self-signed-certificates.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜



### Self-signed certificates

When running locally, or in other situations that may involve self-signed certificates, you may run into the error: `The request failed with error code "DEPTH_ZERO_SELF_SIGNED_CERT"`.

To solve this, you can disable Node.js' rejection of unauthorized certificates by adding the following to `.env.development`:

```shell
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Please note that you need to add `dotenv`, as mentioned earlier, to expose environment variables in your gatsby-config.js or gatsby-node.js files.

**CAUTION:** This should never be set in production. Always ensure that you disable `NODE_TLS_REJECT_UNAUTHORIZED` in development with `gatsby develop` only.

[dotenv]: https://github.com/motdotla/dotenv
[envvars]: https://www.gatsbyjs.org/docs/environment-variables
