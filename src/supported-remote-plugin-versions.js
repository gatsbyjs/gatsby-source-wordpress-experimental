// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `~0.9.1`,
    reason: `WPGraphQL 0.9.0 isn't supported because menu item relay id's changed from nav_menu:id to term:id in 0.9.1.\nUsing WPGatsby 0.4.0 and WPGraphQL 0.9.0 would lead to inconsistent cache invalidation for menus.\nThis doesn't mean you're on WPGraphQL 0.9.0, but explains why the minimum version is 0.9.1`,
  },
  WPGatsby: {
    version: `~0.4.0`,
    reason: `WPGatsby 0.4.0 supports WPGraphQL 0.9.1`,
  },
}

// @todo replace this link with another once we're out of alpha
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`

export { supportedWpPluginVersions, genericDownloadMessage }
