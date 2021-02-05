**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/features/limit-nodes-during-development.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜



# Limit nodes during development

For very large sites it may take quite a while to start `gatsby develop` when you start working on a project. To mitigate this annoyance, we've added a plugin option to limit the number of nodes that will be pulled on any type.

Lets say you have 1000 or even 10,000 posts. You can do the following to only fetch the latest 50!

gatsby-config.js:

```js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-wordpress-experimental`,
      options: {
        url: process.env.WPGRAPHQL_URL,
        type: {
          Post: {
            limit:
              process.env.NODE_ENV === `development`
                ? // Lets just pull 50 posts in development to make it easy on ourselves.
                  50
                : // And all posts in production
                  null,
          },
        },
      },
    },
  ],
}
```

Now when you run `gatsby develop` you can start working in 20 seconds instead of 20 minutes!

:point_left: [Back to Features](./index.md)
