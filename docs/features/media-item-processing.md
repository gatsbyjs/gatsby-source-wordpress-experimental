# Media Item Processing & Handling

Only media items that are referenced by at least 1 other node are sourced. For example if you have image `a.jpeg` and `b.jpeg` and in the `Hello World` post, you add `a.jpeg` as a featured image (or other field) but `b.jpeg` is not included anywhere, only `a.jpeg` will be sourced by Gatsby.
This means if you have 10,000 images in your WordPress instance, but only 1 of those images is used in your site, you will only need to wait for 1 image to download. It's a common scenario for admins to upload 5-10x more images than they use, and that is the reason this feature exists. Currently there is no way to pull all Media Items, but if you need this feature please open an issue (or search for an existing one and thumbs up it).

## Gatsby Image in HTML fields

Media items in html are automatically sourced and image tags are swapped with `gatsby-image`'s

Image tags in html that return 404's are logged to the console with a link to which post or page has the broken image. This allows you to easily discover and fix broken images that were deleted from the media library.

This can be turned off with the `html.useGatsbyImage` boolean plugin option. See [plugin options](../plugin-options.md#html.usegatsbyimage-boolean) for more information.

### Requirements for images in html

Images in html `img` tags which are either relative paths or full paths to your WP instance will be recognized and sourced by Gatsby.

For example, both of the following will be sourced:
```html
<img src="/wp-content/uploads/2021/01/a.jpeg">
<img src="https://mysite.com/wp-content/uploads/2021/01/b.jpeg" />
```

Note that there's currently a hard requirement for both kinds of url's to include `/wp-content/uploads` in order to be picked up.

:point_left: [Back to Features](./index.md)

