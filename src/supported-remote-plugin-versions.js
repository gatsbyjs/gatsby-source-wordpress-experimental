// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `~0.10.0`,
    reason: `WPGraphQL 0.10.0 introduced a large number of changes that required internal source plugin code changes. A big feature is improved support for WordPress previews and improvements to how Menus are handled. Head to https://github.com/wp-graphql/wp-graphql/releases/tag/v0.10.0 for more information on upgrading.`,
  },
  WPGatsby: {
    version: `~0.4.0`,
    reason: `WPGatsby 0.4.0 supports WPGraphQL 0.10.0`,
  },
}

// @todo replace this link with another once we're out of alpha
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`

export { supportedWpPluginVersions, genericDownloadMessage }
