"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.ensurePluginRequirementsAreMet = void 0;

var _url = _interopRequireDefault(require("url"));

var _range = _interopRequireDefault(require("semver/classes/range"));

var _fetchGraphql = _interopRequireDefault(require("../utils/fetch-graphql"));

var _formatLogMessage = require("../utils/format-log-message");

var _constants = require("../constants");

var _supportedRemotePluginVersions = require("../supported-remote-plugin-versions");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _store = _interopRequireDefault(require("../store"));

var _cache = require("../utils/cache");

const parseRange = range => {
  var _versions$, _versions$$semver;

  const {
    set: [versions]
  } = new _range.default(range);
  const isARange = versions.length >= 2;
  const minVersion = versions[0].semver.version;
  const maxVersion = (_versions$ = versions[1]) === null || _versions$ === void 0 ? void 0 : (_versions$$semver = _versions$.semver) === null || _versions$$semver === void 0 ? void 0 : _versions$$semver.version;
  let message;

  if (isARange) {
    message = `Install a version between ${minVersion} and ${maxVersion}.`;
  } else {
    message = `Install version ${minVersion}.`;
  }

  return {
    message,
    minVersion,
    maxVersion,
    isARange
  };
};

const areRemotePluginVersionsSatisfied = async ({
  helpers,
  disableCompatibilityCheck,
  url: wpGraphQLEndpoint
}) => {
  if (disableCompatibilityCheck) {
    return;
  }

  let wpgqlIsSatisfied;
  let wpGatsbyIsSatisfied;

  try {
    const {
      data
    } = await (0, _fetchGraphql.default)({
      query:
      /* GraphQL */
      `
        query WPGatsbyCompatibility(
          $wpgqlVersion: String!
          $wpgatsbyVersion: String!
        ) {
          wpGatsbyCompatibility(
            wpGatsbyVersionRange: $wpgatsbyVersion
            wpGQLVersionRange: $wpgqlVersion
          ) {
            satisfies {
              wpGQL
              wpGatsby
            }
          }
        }
      `,
      variables: {
        wpgqlVersion: _supportedRemotePluginVersions.supportedWpPluginVersions.WPGraphQL.version,
        wpgatsbyVersion: _supportedRemotePluginVersions.supportedWpPluginVersions.WPGatsby.version
      },
      panicOnError: false,
      throwGqlErrors: true
    });
    wpgqlIsSatisfied = data.wpGatsbyCompatibility.satisfies.wpGQL;
    wpGatsbyIsSatisfied = data.wpGatsbyCompatibility.satisfies.wpGatsby;
  } catch (e) {
    if (e.message.includes(`Cannot query field "wpGatsbyCompatibility" on type "RootQuery".`)) {
      helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`Your version of WPGatsby is too old to determine if we're compatible.${_supportedRemotePluginVersions.genericDownloadMessage}`));
    } else {
      helpers.reporter.panic(e.message);
    }
  }

  const shouldDisplayWPGraphQLReason = !wpgqlIsSatisfied && _supportedRemotePluginVersions.supportedWpPluginVersions.WPGraphQL.reason;
  const shouldDisplayWPGatsbyReason = !wpGatsbyIsSatisfied && _supportedRemotePluginVersions.supportedWpPluginVersions.WPGatsby.reason;
  const shouldDisplayAtleastOneReason = shouldDisplayWPGraphQLReason || shouldDisplayWPGatsbyReason;
  const shouldDisplayBothReasons = shouldDisplayWPGraphQLReason && shouldDisplayWPGatsbyReason; // a message explaining why these are the minimum versions

  const reasons = `${shouldDisplayAtleastOneReason ? `\n\nReasons:\n\n` : ``}${shouldDisplayWPGraphQLReason ? `- ${_supportedRemotePluginVersions.supportedWpPluginVersions.WPGraphQL.reason}` : ``}${shouldDisplayBothReasons ? `\n\n` : ``}${shouldDisplayWPGatsbyReason ? `- ${_supportedRemotePluginVersions.supportedWpPluginVersions.WPGatsby.reason}` : ``}`;
  let message = ``;

  if (!wpgqlIsSatisfied) {
    const {
      message: rangeMessage,
      minVersion,
      maxVersion
    } = parseRange(_supportedRemotePluginVersions.supportedWpPluginVersions.WPGraphQL.version);
    message += `Your remote version of WPGraphQL is not within the accepted range (${_supportedRemotePluginVersions.supportedWpPluginVersions.WPGraphQL.version}).

${rangeMessage}

If the version of WPGraphQL in your WordPress instance is lower than ${minVersion}
it means you need to upgrade your version of WPGraphQL.

If the version of WPGraphQL in your WordPress instance is higher than ${maxVersion || minVersion}
it may mean you need to upgrade your version of gatsby-source-wordpress.

You can find a matching WPGraphQL version at https://github.com/wp-graphql/wp-graphql/releases`;
  }

  if (!wpGatsbyIsSatisfied && !wpgqlIsSatisfied) {
    message += `\n\n---------------\n\n`;
  }

  if (!wpGatsbyIsSatisfied) {
    const {
      message: rangeMessage,
      minVersion,
      maxVersion
    } = parseRange(_supportedRemotePluginVersions.supportedWpPluginVersions.WPGatsby.version);

    const {
      hostname,
      protocol
    } = _url.default.parse(wpGraphQLEndpoint);

    message += `Your remote version of WPGatsby is not within the accepted range (${_supportedRemotePluginVersions.supportedWpPluginVersions.WPGatsby.version})

${rangeMessage}

If the version of WPGatsby in your WordPress instance is lower than ${minVersion}
it means you need to upgrade your version of WPGatsby.

If the version of WPGatsby in your WordPress instance is higher than ${maxVersion || minVersion}
it may mean you need to upgrade your version of gatsby-source-wordpress.

Download a matching version at https://github.com/gatsbyjs/wp-gatsby/releases
or update via ${protocol}//${hostname}/wp-admin/plugins.php`;
  }

  if (!wpGatsbyIsSatisfied || !wpgqlIsSatisfied) {
    message += `
${reasons}`;
  }

  if (message) {
    helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(message));
  }
}; // This blank request is used to find debug messages
// when a graphql request is made with no query
// for example if 2 root fields are registered with the fieldname "products"
// this will throw a helpful error message explaining that one should be removed


const blankGetRequest = async ({
  url,
  helpers
}) => (0, _nodeFetch.default)(url).then(response => response.json()).then(json => {
  var _json$errors;

  if (json === null || json === void 0 ? void 0 : (_json$errors = json.errors) === null || _json$errors === void 0 ? void 0 : _json$errors.length) {
    var _firstError$message;

    const firstError = json.errors[0];

    if (firstError.debugMessage || firstError.message && !((_firstError$message = firstError.message) === null || _firstError$message === void 0 ? void 0 : _firstError$message.includes(`GraphQL Request must include at least one of those two parameters: "query" or "queryId"`))) {
      helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`WPGraphQL returned a debug message on startup:

${firstError.debugMessage || firstError.message}
          `));
    }
  }
}).catch(e => {});

const isWpGatsby = async () => (0, _fetchGraphql.default)({
  query:
  /* GraphQL */
  `
      {
        isWpGatsby
      }
    `,
  errorMap: {
    from: `Cannot query field "isWpGatsby" on type "RootQuery".`,
    // @todo replace this link with another once we're out of alpha
    to: `WPGatsby is not active in your WordPress installation.\nTo download the latest versions of WPGatsby and WPGraphL, visit:\nhttps://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins`
  },
  panicOnError: true,
  isFirstRequest: true
});

const prettyPermalinksAreEnabled = async ({
  helpers
}) => {
  try {
    const {
      data
    } = await (0, _fetchGraphql.default)({
      query:
      /* GraphQL */
      `
        {
          generalSettings {
            url
          }
          wpGatsby {
            arePrettyPermalinksEnabled
          }
        }
      `,
      throwGqlErrors: true
    });

    if (!data.wpGatsby.arePrettyPermalinksEnabled) {
      helpers.reporter.log(``);
      helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`
Pretty permalinks are not enabled in your WordPress instance.
Gatsby routing requires this setting to function properly.
Please enable pretty permalinks by changing your settings at
${data.generalSettings.url}/wp-admin/options-permalink.php.
`));
    }
  } catch (e) {// the WPGatsby version is too old to query for wpGatsby.arePrettyPermalinksEnabled
  }
};

const ensurePluginRequirementsAreMet = async (helpers, _pluginOptions) => {
  if (helpers.traceId === `refresh-createSchemaCustomization`) {
    return;
  }

  const {
    gatsbyApi: {
      pluginOptions: {
        url,
        debug: {
          disableCompatibilityCheck
        }
      }
    },
    remoteSchema: {
      schemaWasChanged
    }
  } = _store.default.getState(); // if we don't have a cached remote schema MD5, this is a cold build


  const isFirstBuild = !(await (0, _cache.getPersistentCache)({
    key: _constants.MD5_CACHE_KEY
  }));

  if (!schemaWasChanged && !isFirstBuild) {
    return;
  }

  await blankGetRequest({
    url,
    helpers
  });
  await Promise.all([isWpGatsby(), prettyPermalinksAreEnabled({
    helpers
  }), areRemotePluginVersionsSatisfied({
    helpers,
    url,
    disableCompatibilityCheck
  })]);
};

exports.ensurePluginRequirementsAreMet = ensurePluginRequirementsAreMet;