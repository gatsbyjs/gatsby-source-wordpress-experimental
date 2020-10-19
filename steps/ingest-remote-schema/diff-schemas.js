"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.checkIfSchemaHasChanged = void 0;

var _url = _interopRequireDefault(require("url"));

var _fetchGraphql = _interopRequireDefault(require("../../utils/fetch-graphql"));

var _store = _interopRequireDefault(require("../../store"));

var _gql = _interopRequireDefault(require("../../utils/gql"));

var _formatLogMessage = require("../../utils/format-log-message");

var _constants = require("../../constants");

var _gatsbyCoreUtils = require("gatsby-core-utils");

var _cache = require("../../utils/cache");

const checkIfSchemaHasChanged = async (_, pluginOptions) => {
  const state = _store.default.getState();

  const {
    helpers
  } = state.gatsbyApi;
  let lastCompletedSourceTime = await helpers.cache.get(_constants.LAST_COMPLETED_SOURCE_TIME);
  const activity = helpers.reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`diff schemas`));

  if (pluginOptions.verbose && lastCompletedSourceTime) {
    activity.start();
  }

  const {
    data
  } = await (0, _fetchGraphql.default)({
    query: (0, _gql.default)`
      {
        schemaMd5
        # also get the wpUrl to save on # of requests
        # @todo maybe there's a better place for this
        generalSettings {
          url
        }
      }
    `
  });
  const {
    schemaMd5,
    generalSettings: {
      url: wpUrl
    }
  } = data;

  if (_url.default.parse(wpUrl).protocol !== _url.default.parse(pluginOptions.url).protocol) {
    helpers.reporter.log(``);
    helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`

The Url set in plugin options has a different protocol than the Url saved in WordPress general settings.

options.url: ${pluginOptions.url}
WordPress settings: ${wpUrl}

This may cause subtle bugs, or it may be fine.
Please consider addressing this issue by changing your WordPress settings or plugin options accordingly.

`));
  }

  let cachedSchemaMd5 = await helpers.cache.get(_constants.MD5_CACHE_KEY);
  let foundUsableHardCachedData;

  if (!cachedSchemaMd5) {
    cachedSchemaMd5 = await (0, _cache.getHardCachedData)({
      key: _constants.MD5_CACHE_KEY
    });
    foundUsableHardCachedData = cachedSchemaMd5 && !!(await (0, _cache.getHardCachedNodes)());
  }

  await (0, _cache.setPersistentCache)({
    key: _constants.MD5_CACHE_KEY,
    value: schemaMd5
  });
  const schemaWasChanged = schemaMd5 !== cachedSchemaMd5;
  const pluginOptionsMD5Key = `plugin-options-md5`;
  const lastPluginOptionsMD5 = await (0, _cache.getPersistentCache)({
    key: pluginOptionsMD5Key
  });
  const pluginOptionsMD5 = (0, _gatsbyCoreUtils.createContentDigest)(pluginOptions);
  const shouldClearHardCache = schemaWasChanged || lastPluginOptionsMD5 !== pluginOptionsMD5;

  if (shouldClearHardCache && foundUsableHardCachedData) {
    await (0, _cache.clearHardCache)();
    foundUsableHardCachedData = false;
  }

  await (0, _cache.setPersistentCache)({
    key: pluginOptionsMD5Key,
    value: pluginOptionsMD5
  });

  if (lastCompletedSourceTime && schemaWasChanged && pluginOptions && pluginOptions.verbose) {
    helpers.reporter.log(``);
    helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`The remote schema has changed since the last build, re-fetching all data`));
    helpers.reporter.info((0, _formatLogMessage.formatLogMessage)(`Cached schema md5: ${cachedSchemaMd5}`));
    helpers.reporter.info((0, _formatLogMessage.formatLogMessage)(`Remote schema md5: ${schemaMd5}`));
    helpers.reporter.log(``);
  } else if (!lastCompletedSourceTime && pluginOptions.verbose) {
    helpers.reporter.log(``);
    helpers.reporter.info((0, _formatLogMessage.formatLogMessage)(`\n\n\tThis is either your first build or the cache was cleared.\n\tPlease wait while your WordPress data is synced to your Gatsby cache.\n\n\tMaybe now's a good time to get up and stretch? :D\n`));
  } // record wether the schema changed so other logic can beware
  // as well as the wpUrl because we need this sometimes :p


  _store.default.dispatch.remoteSchema.setState({
    schemaWasChanged,
    wpUrl,
    foundUsableHardCachedData
  });

  if (pluginOptions.verbose && lastCompletedSourceTime) {
    activity.end();
  }

  return schemaWasChanged;
};

exports.checkIfSchemaHasChanged = checkIfSchemaHasChanged;