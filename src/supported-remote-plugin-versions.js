// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `~0.9.0`,
  },
  WPGatsby: {
    version: `~0.3.0`,
  },
}

// @todo replace this link with another once we're out of alpha
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`

export { supportedWpPluginVersions, genericDownloadMessage }
