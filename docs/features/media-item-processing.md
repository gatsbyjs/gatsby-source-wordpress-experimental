**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/features/media-item-processing.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜



# Image/File Processing & Handling

## Only referenced media items are sourced

Only media items that are referenced by at least 1 other node are sourced. For example if you have image `a.jpeg` and `b.jpeg` and in the `Hello World` post, you add `a.jpeg` as a featured image (or other field) but `b.jpeg` is not included anywhere, only `a.jpeg` will be sourced by Gatsby.
This means if you have 10,000 images in your WordPress instance, but only 1 of those images is used in your site, you will only need to wait for 1 image to download. It's a common scenario for admins to upload 5-10x more images than they use, and that is the reason this feature exists. Currently there is no way to pull all Media Items, but if you need this feature please open an issue (or search for an existing one and thumbs up it).

## Gatsby Image in HTML fields

Media items in html are automatically sourced and image tags are swapped with `gatsby-image`'s

This can be turned off with the `html.useGatsbyImage` boolean plugin option. See [plugin options](../plugin-options.md#html.usegatsbyimage-boolean) for more information.

Image tag URL's in html that return 404's are logged to the terminal output with a link to which post or page the broken image is attached.
This allows you to easily discover and fix broken images that were deleted from the media library.
By default 404's will fail the build to prevent deploying a broken site. You can disable this with the [`allow404Images`](../plugin-options.md#productionallow404images-boolean) option.

### Requirements for images in html to be converted to Gatsby images

Images in html `img` tags which are either relative paths or full paths to your WP instance will be recognized and sourced by Gatsby.

For example, both of the following will be sourced:

```html
<img src="/wp-content/uploads/2021/01/a.jpeg" />
<img src="https://mysite.com/wp-content/uploads/2021/01/b.jpeg" />
```

Note that there's currently a hard requirement for both kinds of url's to include `/wp-content/uploads` in order to be picked up. If your media items are stored in another directory they will not become Gatsby iamges.

## Preventing Image/File sourcing

If you would prefer to let WordPress handle serving images for you, you can prevent Gatsby from fetching any images with the following plugin options:

```js
{
    resolve: `gatsby-source-wordpress-experimental`,
    options: {
        url: process.env.WPGRAPHQL_URL,
        html: {
            createStaticFiles: false,
            useGatsbyImage: false,
        },
        type: {
            MediaItem: { lazyNodes: true },
        },
    },
}
```

Note that if you make a GraphQL request for any media item in Gatsby, it will still fetch that media item while resolving the GraphQL response data.
If you don't want this to happen you will have to make sure you don't query for those fields.

:point_left: [Back to Features](./index.md)

## Referencing static file public URL's

If you want to use image/file url's directly instead of (or in addition) to using Gatsby Image, you can query for the `WpMediaItem.localFile.publicURL` field in GraphQL.
However, for this field to be available you'll need to first install and configure `gatsby-source-filesystem` and point it at atleast 1 local file.

You can install it in your project with `npm install gatsby-source-filesystem` or `yarn add gatsby-source-filesystem`. Once you do that you can add it to your `gatsby-config.js` like this:

```js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `assets`,
        path: `${__dirname}/content/assets`, // this needs to include a path with atleast 1 file
      },
    },
  ],
}
```

Now when you run `gatsby develop`, you should be able to query for the public URL of any local file node in WP.
This is mostly useful for when you need a direct file link to a PDF or other asset that you want your users to be able to download.

```graphql
query {
  allWpPost {
    nodes {
      featuredImage {
        node {
          localFile {
            publicURL
          }
        }
      }
    }
  }
}
```
