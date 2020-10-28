require(`dotenv`).config({
  path: `.env.GATSBY_CONCURRENT_DOWNLOAD`,
})

require(`dotenv`).config({
  path: `.env.WORDPRESS_BASIC_AUTH`,
})

// require .env.development or .env.production
require(`dotenv`).config({
  path: `.env.test`,
})

// this is it's own conditional object so we can run
// an int test with all default plugin options
const wpPluginOptions = {}

module.exports = {
  plugins: [
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/assets/images`,
      },
    },
    {
      resolve: require.resolve(`../plugin/package.json`),
      options: {
        url: process.env.WPGRAPHQL_URL,
        auth: {
          htaccess: {
            username: process.env.HTACCESS_USERNAME,
            password: process.env.HTACCESS_PASSWORD,
          },
        },
        ...wpPluginOptions,
      },
    },
    `gatsby-plugin-chakra-ui`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-react-svg`,
      options: {
        rule: {
          include: /\.inline\.svg$/, // See below to configure properly
        },
      },
    },
    `gatsby-plugin-netlify-cache`,
  ],
}
