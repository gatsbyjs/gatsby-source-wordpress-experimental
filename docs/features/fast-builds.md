# Fast Builds

Due to our [WPGatsby](https://github.com/gatsbyjs/wp-gatsby) WordPress plugin, we can do very aggressive caching. This means that even without incremental builds your build times will be on fire!

You can expect to see massively faster build times than previous versions of `gatsby-source-wordpress` and `gatsby-source-graphql`. The actual cached build time will vary depending on the size and complexity of your Gatsby site/app and the power of your CI service, but it will be in the ballpark of <1 minute for a ~1000 page site with proper caching.

Any CI/CD service will work to build your Gatsby site but [Gatsby Cloud](https://www.gatsbyjs.com/get-started/) is recommended for your build service. If you're looking to try out WP/Gatsby and want something free, Cloud has a generous free tier. It will build faster than Netlify and it can deploy to Netlify hosting for free. It also comes with 25 free real-time edits***** per day for 2 weeks, so you can try out the paid features of Gatsby Cloud to see if it will work for your project (hint, it surely will. it's :fire:!). 

*****_a real-time edit is 1 preview or inc-build_



:point_left: [Back to Features](./index.md)

