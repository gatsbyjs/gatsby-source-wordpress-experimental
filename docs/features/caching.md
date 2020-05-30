# Caching

After the first build or run of develop only changed data is pulled.

If the remote schema changes between builds, the entire cache will be invalidated and the plugin will start a fresh pull/build. This can happen when updating your `gatsby-node.js` , `gatsby-config.js` or when adding a new npm package to your project.

Currently the cache isn't selectively invalidated for every possible user interaction. For now it only works for the following events:

- Users
  - creating
  - updating
  - deleting
  - reattributing posts
  - creating/deleting based on wether the user becomes public/private
- Pages/Posts/CPT's
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



:point_left: [Back to Features](./index.md)

