// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `~0.10.3`,
    reason: `WPGraphQL 0.10.0 introduced a large number of changes that required internal source plugin code changes. A big feature is improved support for WordPress previews and improvements to how Menus are handled. 0.10.3 fixed a private post regression that could cause cold builds to fail. Head to https://github.com/wp-graphql/wp-graphql/releases/tag/v0.10.0 for more information on upgrading.`,
  },
  WPGatsby: {
    version: `~0.4.14`,
    reason: `WPGatsby 0.4.14 supports WPGraphQL 0.10.3. Version 0.4.13 and before had a bug where making a published post into a draft wouldn't delete the post in Gatsby.`,
  },
}

// @todo replace this link with another once we're out of alpha
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`

export { supportedWpPluginVersions, genericDownloadMessage }
