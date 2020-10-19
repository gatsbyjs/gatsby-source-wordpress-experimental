"use strict";

exports.__esModule = true;
exports.genericDownloadMessage = exports.supportedWpPluginVersions = void 0;
// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `>=0.10.3 <0.14.0`,
    reason: null
  },
  WPGatsby: {
    version: `~0.4.14`,
    reason: null
  }
}; // @todo replace this link with another once we're out of alpha

exports.supportedWpPluginVersions = supportedWpPluginVersions;
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`;
exports.genericDownloadMessage = genericDownloadMessage;