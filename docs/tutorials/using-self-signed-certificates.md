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
