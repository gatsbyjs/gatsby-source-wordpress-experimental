## Incremental Builds

## WP Preview

Since WP currently only revisions titles and post content, the same is true for WPGraphQL. Soon ACF revision support will be added and any unrevisioned data/meta will be pulled from the main post of the revision (for ex for featured images). What this means is your previews will only contain title and post content data. This will soon be improved/fixed once WPGraphQL supports this.

To get started, setup a Preview instance on Gatsby cloud, then take your preview URL and add it to your WP instance under wp-admin->Settings->GatsbyJS->"Preview Webhook"

You can also host your own preview server or test it out locally by running `ENABLE_GATSBY_REFRESH_ENDPOINT=true gatsby develop` and pointing your Preview webhook setting at `http://localhost:8000` or at the url for your self-hosted preview instance. If your WP instance is on https or is outside your local network, you'll need to use ngrok to create a tunnel to your local Gatsby instance.

## Schema merging

- Automatically pulls as much of the remote WPGQL schema as possible and creates Gatsby nodes from that data. Data is never fetched twice. If we will already have data, for example on a connection field between an Author and a Post, we only pull the id of the Post and link the field to the Post node in Gatsby.
- Potentially works with all (or most) WPGQL plugins. So ACF, polylang, etc will work. See "known issues" below if a plugin doesn't work.

## Media Items

- Only referenced media items and files are downloaded. If you have a site where an admin has uploaded 10k images but there are only 1k pages, we don't want to have to pull all those images, just the ones that are used. That's the default behaviour of the source plugin. There is also an option to lazily download files as they're queried for, but it's currently problematic for some CI providers, it messes up cli output, and Gatsby currently only runs 4 gql queries concurrently which slows down file fetching. This will work in the future though!

## DX improvements

- Do you have a site with 50,000 posts and you want to do some quick development on it? You can limit the amount of nodes that will be pulled by setting an option to limit the amount of posts that will be pulled (by typename) in the plugin options. For example, you can get working quickly by setting the plugin to only pull 10 posts.

## Caching

- After the first build or run of develop only changed data is pulled.
- If the remote schema changes between builds, the entire cache will be invalidated and the plugin will start a fresh pull/build.
- The cache isn't selectively invalidated for every possible user interaction.
- For now it only works for the following events:
  - Users:
    - creating
    - updating
    - deleting
    - reattributing posts
    - creating/deleting based on wether the user becomes public/private
  - Pages/Posts
    - creating
    - deleting
    - drafting
    - updating
  - Media Items
    - editing
    - creating
    - deleting
  - Categories/Terms/Tags
    - creating
    - editing
    - deleting
- The following events will not yet properly update the cache:
  - Changing the home/blog page
  - Changing permalink structure
  - Saving any WP options
  - Saving ACF options
  - ?
