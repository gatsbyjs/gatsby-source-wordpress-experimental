## Considerations

- If you have a large site, you may need to ask your hosting provider to remove rate limiting for your WP instance. Fetching many images may trigger rate limiting protections and fail your build.

## Debugging WP 50\* errors and timeouts

If your builds fail during node sourcing due to timeouts, lowering the env variables GATSBY_CONCURRENT_DOWNLOAD, will help. The problem is that your server is only serving a smaller number of concurrent requests than the number of node types you have in your remote schema. So for example if you had 3 types, Page, Post, and User, and your server only allowed 1 concurrent request, the source plugin might try to make a request for each of these types, but the server would only start responding to or processing the first request. The server would queue serving the other requests until the first request finished. The issue here is that our last 2 requests started at the same time as the first request, but the server didn't fulfill those requests until after 30 seconds had passed, causing our requests to time out. You can either increase the number of concurrent requests your server can handle or decrease the GATSBY_CONCURRENT_DOWNLOAD env variable to a lower number than the total number of node types that are being sourced. In the future the source plugin will handle this automatically, but for now this env var need to be tweaked.

If your builds fail while fetching remote image files with a 50\* error, the problem is the same as the issue above, except that your server is able to serve many more concurrent requests than in the description above. Try slightly lowering GATSBY_CONCURRENT_DOWNLOAD which has a default of 200. Continue lowering this number until your server is ok with this. Alternatively, if you add a WP CDN like Jetpack or similar, you may not need to lower this env var. Again, this will be accounted for automatically in the source plugin, but for now manual intervention/configuration is required.

If your builds locally fail due to image timeouts when runnning `gatsby develop`, you can enable this plugin option:

```js
{
      resolve: `gatsby-source-wordpress-experimental`,
      options: {
        develop: {
          hardCacheMediaFiles: true,
        },
      },
    },
```

This option will cache images outside of the Gatsby cache as images are fetched, so that you don't need to redownload all the same images when you restart your failed process.

## Debugging Previews

Since a Previewed post might have a lot less data attached to it than what you're testing with during development, you might get errors in previews when that data is missing. You can debug your previews by running Gatsby in preview mode locally.

- Run Gatsby in refresh mode with `ENABLE_GATSBY_REFRESH_ENDPOINT=true gatsby develop`
- Install ngrok with `npm i -g ngrok`
- In a new terminal window run `ngrok http 8000`
- In your WP instances GatsbyJS settings, set your Preview instance URL to `https://your-ngrok-url.ngrok.io/8000` and your preview refresh endpoint `https://your-ngrok-url.ngrok.io/8000/__refresh`

Now when you click preview in `wp-admin` it will use your local instance of Gatsby. You can inspect the preview template to see which Gatsby path is being loaded in the preview iframe and open it directly to do further debugging.

## Debugging node sourcing

If you're getting errors while the nodes are being sourced, you can see which query had the error with the following options:

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
  options: {
    debug: {
      graphql: {
        // writes all the internal gql queries that are used in node sourcing
        // into ./your-project/WordPress/GraphQL/*.gql
        // so that you can view them and make those requests to WP directly
        // to help debug the issue
        writeQueriesToDisk: true,
        // prints which query vars were being used in the query that failed
        showQueryVarsOnError: true,
        // if there is a gql request that returns data as well as errors,
        // that wont cause the build build to exit if this option is set to false.
        // to exit the build when any errors are returned, set this to true
        panicOnError: true,
      },
    },
  }
}
```

The terminal output will log which type returned the error during node sourcing. You can then look in `./your-project/WordPress/GraphQL/*.gql` to find the corresponding gql file, and manually make that query in something like GraphQL Playground or Graphiql to help troubleshoot what's going wrong. This is also very helpful debugging information when opening and issue to get help or report a bug.
