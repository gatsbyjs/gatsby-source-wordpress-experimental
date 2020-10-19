"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.startPollingForContentUpdates = void 0;

var _fetchNodeUpdates = _interopRequireDefault(require("./fetch-node-updates"));

var _formatLogMessage = require("../../../utils/format-log-message");

var _store = _interopRequireDefault(require("../../../store"));

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

const refetcher = async (msRefetchInterval, helpers, {
  reconnectionActivity = null,
  retryCount = 1
} = {}) => {
  try {
    await (0, _fetchNodeUpdates.default)({
      intervalRefetching: true,
      throwFetchErrors: true,
      throwGqlErrors: true
    });

    if (reconnectionActivity) {
      reconnectionActivity.end();
      helpers.reporter.success((0, _formatLogMessage.formatLogMessage)(`Content updates re-connected after ${retryCount} ${retryCount === 1 ? `try` : `tries`}`));
      reconnectionActivity = null;
      retryCount = 1;
    }
  } catch (e) {
    var _pluginOptions$debug;

    const {
      pluginOptions
    } = (0, _getGatsbyApi.getGatsbyApi)();

    if (pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$debug = pluginOptions.debug) === null || _pluginOptions$debug === void 0 ? void 0 : _pluginOptions$debug.throwRefetchErrors) {
      throw e;
    }

    if (!reconnectionActivity) {
      reconnectionActivity = helpers.reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`Content update error: "${e.message}"`));
      reconnectionActivity.start();
      reconnectionActivity.setStatus(`retrying...`);
    } else {
      retryCount++;
      reconnectionActivity.setStatus(`retried ${retryCount} times`);
    } // retry after retry count times 5 seconds


    const retryTime = retryCount * 5000; // if the retry time is greater than or equal to the max (60 seconds)
    // use the max, otherwise use the retry time

    const maxWait = 60000;
    const waitFor = retryTime >= maxWait ? maxWait : retryTime;
    await new Promise(resolve => setTimeout(resolve, waitFor));
  }

  setTimeout(() => refetcher(msRefetchInterval, helpers, {
    reconnectionActivity,
    retryCount
  }), msRefetchInterval);
};
/**
 * Starts constantly refetching the latest WordPress changes
 * so we can update Gatsby nodes when data changes
 */


const startPollingForContentUpdates = (helpers, pluginOptions) => {
  if (process.env.WP_DISABLE_POLLING) {
    return;
  }

  const {
    verbose
  } = _store.default.getState().gatsbyApi.pluginOptions;

  const msRefetchInterval = pluginOptions && pluginOptions.develop && pluginOptions.develop.nodeUpdateInterval ? pluginOptions.develop.nodeUpdateInterval : 300;

  if (verbose) {
    helpers.reporter.log(``);
    helpers.reporter.info((0, _formatLogMessage.formatLogMessage)`Watching for WordPress changes`);
  }

  refetcher(msRefetchInterval, helpers);
};

exports.startPollingForContentUpdates = startPollingForContentUpdates;