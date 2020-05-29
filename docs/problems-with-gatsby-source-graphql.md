### Problems with `gatsby-source-graphql`

`gatsby-source-graphql` skips the Gatsby Node model altogether, and allows you to directly pull data from WPGraphQL. At first this seems really attractive as things just work, but as your site grows beyond a handful of pages, a few problems arise.

- There's no way to use Gatsby Preview effectively as the Preview instance will have to run every query in your Gatsby site again. This means in many cases you would need to wait nearly the length of an entire uncached build for your preview to show up.
- There's no way to cache data. This means incremental builds can't work their magic, but it also means regular builds are very slow. Every content change in WordPress requires all the data to be refetched, making things very slow.
- Using `gatsby-image` is difficult and the images can't be cached and need to be constantly refetched during every build.



All of the above issues are fixed by using this plugin! :)



