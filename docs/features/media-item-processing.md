# Media Item handling

- Only media items that are referenced by at least 1 node are sourced.
  This means if you have 10,000 images in your WordPress instance, but only 1 of those images is used in your site, you will only need to wait for 1 image to download.



Only referenced media items and files are downloaded. If you have a site where an admin has uploaded 10k images but there are only 1k pages, we don't want to have to pull all those images, just the ones that are used. That's the default behaviour of the source plugin. There is also an option to lazily download files as they're queried for, but it's currently problematic for some CI providers, it messes up cli output, and Gatsby currently only runs 4 gql queries concurrently which slows down file fetching. This will work in the future though!