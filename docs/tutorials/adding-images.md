# What this tutorial covers:



In this tutorial, you will install the several image plugins and components in order to pull image data from a WordPress account into your Gatsby site and render that data. This [Gatsby + WordPress demo site](https://using-wordpress.gatsbyjs.org/) shows you a sample of what you’re going to be building in this tutorial, although in this tutorial you’ll just focus on adding images.



## Why go through this tutorial?

Images are one of the most beautiful and striking ways to communicate to people, and are a key part of creating an effective and positive user experience; at the same time, high quality images can load slowly and cause text boxes to jump around, both of which make it difficult for people to be patient with visiting your website.

The Gatsby Way™ of creating images describes a set of best practices that help you optimize performance and responsiveness of images so that you can get the benefits of awesome images that don't slow down your site. This [Gatsbygram site](https://gatsbygram.gatsbyjs.org/) (an Instagram feed fed through Gatsby) shows off the svg image tracing effect. Here’s an [image processing demo site](https://image-processing.gatsbyjs.org/) exploring how to have fun with images in your Gatsby site.



## Installing the `gatsby-source-wordpress-experimental` plugin

First you’ll need to install the `gatsby-source-wordpress-experimental` plugin that has images ready for you to pull into your site.

Follow the [Building a new app/site tutorial](./creating-an-app-or-site.md) before you continue.



## Installing plugins to help with images

Now you will need to add the `gatsby-transformer-sharp` and `gatsby-plugin-sharp` plugins to `gatsby-config.js`, add a GraphQL query to a page, add an image to the page, and then view the result in the browser.

First, you’ll need to install a few plugins and their dependencies:

```shell
npm install --save gatsby-transformer-sharp gatsby-plugin-sharp gatsby-image
```

Place these plugins at the end of your plugins array in your `gatsby-config.js` like so:

```javascript:title=gatsby-config.js
module.exports = {
  siteMetadata: {
    title: `Gatsby WordPress Tutorial`,
    description: `An example to learn how to source data from WordPress.`,
    author: `@gatsbyjs`,
  },
  plugins: [
    /*
     * Gatsby's data processing layer begins with “source”
     * plugins. Here the site sources its data from WordPress.
     */
    {
      resolve: `gatsby-source-wordpress-experimental`,
      options: {
        /*
         * The full URL of the WordPress site's GraphQL API.
         * Example : 'https://www.example-site.com/graphql'
         */
        url: `https://live-gatbsyjswp.pantheonsite.io/graphql`,
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // highlight-start
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",
    // highlight-end
  ],
}
```



## Creating GraphQL queries that pull in images from WordPress

Now you are ready to create a GraphQL query to pull in some images from the WordPress site.

Run:

```shell
npm run develop
```

Open `http://localhost:8000` and `http://localhost:8000/___graphql`.

Here’s an example of creating specific widths and heights for images:

```graphql
{
  allWordpressPost {
    edges {
      node {
        childWordPressAcfPostPhoto {
          photo {
            localFile {
              childImageSharp {
                # Try editing the "width" and "height" values.
                resolutions(width: 200, height: 200) {
                  # In the GraphQL explorer, use field names
                  # like "src". In your site's code, remove them
                  # and use the fragments provided by Gatsby.
                  src

                  # This fragment won't work in the GraphQL
                  # explorer, but you can use it in your site.
                  # ...GatsbyImageSharpResolutions_withWebp
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Here’s an example query for generating different sizes of an image:

```graphql
{
  allWordpressPost {
    edges {
      node {
        childWordPressAcfPostPhoto {
          photo {
            localFile {
              childImageSharp {
                # Try editing the "maxWidth" value to generate resized images.
                fluid(maxWidth: 500) {
                  # In the GraphQL explorer, use field names
                  # like "src". In your site's code, remove them
                  # and use the fragments provided by Gatsby.
                  src

                  # This fragment won't work in the GraphQL
                  # explorer, but you can use it in your site
                  # ...GatsbyImageSharpFluid_withWebp
                }
              }
            }
          }
        }
      }
    }
  }
}
```

In either case, you can add traced SVG support by adding `_tracedSVG` to the end of each fragment. _Note this won’t work in the GraphQL explorer._

## Rendering the images to `index.js`

Here is what your `index.js` should look like with the query added:

```jsx:title=src/pages/index.js
import React from "react"
import { graphql, Link } from "gatsby"
import Img from "gatsby-image"

const IndexPage = ({ data }) => {
  const imagesResolutions = data.allWordpressPost.edges.map(
    edge =>
      edge.node.childWordPressAcfPostPhoto.photo.localFile.childImageSharp
        .resolutions
  )
  return (
    <div>
      <h1>Hi people</h1>
      <p>Welcome to your new Gatsby site.</p>
      <p>Now go build something great.</p>
      {imagesResolutions.map(imageRes => (
        <Img resolutions={imageRes} key={imageRes.src} />
      ))}
      <Link to="/page-2/">Go to page 2</Link>
    </div>
  )
}

export default IndexPage

export const query = graphql`
  query {
    allWordpressPost {
      edges {
        node {
          childWordPressAcfPostPhoto {
            photo {
              localFile {
                childImageSharp {
                  # edit the maxWidth value to generate resized images
                  resolutions(width: 500, height: 500) {
                    ...GatsbyImageSharpResolutions_withWebp_tracedSVG
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
```

Your demo site should look something like this:

![Demo site example](./images/wordpress-image-tutorial.gif)

## Testing your image loading speed and effects

It is useful and can be fun to purposefully slow down your browser to see image effects animate more slowly.

Open your browser console and change the network speed to something slower. In Chrome, you can click on the “network” tab, then on the drop down arrow next to the word “Online.” Then click “Slow 3G.” Now, reload your page and watch the blur-up and SVG effects in action. The network tab also shows statistics on when each image loaded and how much time it took them to load.

![Network](./images/network.png)

![Slow 3G](./images/slow-3g.png)
