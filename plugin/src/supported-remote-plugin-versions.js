// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `>=0.14.0 <0.15.0`,
    reason: null,
  },
  WPGatsby: {
    version: `>=0.5.4 <0.6.0`,
    reason: null,
  },
}

// @todo replace this link with another once we're out of alpha
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`

export { supportedWpPluginVersions, genericDownloadMessage }
