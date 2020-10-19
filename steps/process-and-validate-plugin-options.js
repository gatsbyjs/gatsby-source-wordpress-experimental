"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.processAndValidatePluginOptions = void 0;

var _store = _interopRequireDefault(require("../store"));

var _formatLogMessage = require("../utils/format-log-message");

var _isInteger = _interopRequireDefault(require("lodash/isInteger"));

const optionsProcessors = [{
  name: `pluginOptions.type.MediaItem.limit is not allowed`,
  test: ({
    userPluginOptions
  }) => {
    var _userPluginOptions$ty, _userPluginOptions$ty2;

    return !!(userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ty = userPluginOptions.type) === null || _userPluginOptions$ty === void 0 ? void 0 : (_userPluginOptions$ty2 = _userPluginOptions$ty.MediaItem) === null || _userPluginOptions$ty2 === void 0 ? void 0 : _userPluginOptions$ty2.limit);
  },
  processor: ({
    helpers,
    userPluginOptions
  }) => {
    var _userPluginOptions$ty3, _userPluginOptions$ty4;

    helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`PluginOptions.type.MediaItem.limit is an disallowed plugin option.\nPlease remove the MediaItem.limit option from gatsby-config.js (currently set to ${userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ty3 = userPluginOptions.type) === null || _userPluginOptions$ty3 === void 0 ? void 0 : (_userPluginOptions$ty4 = _userPluginOptions$ty3.MediaItem) === null || _userPluginOptions$ty4 === void 0 ? void 0 : _userPluginOptions$ty4.limit})\n\nMediaItem nodes are automatically limited to 0 and then fetched only when referenced by other node types. For example as a featured image, in custom fields, or in post_content.`));
  }
}, {
  name: `excludeFields-renamed-to-excludeFieldNames`,
  test: ({
    userPluginOptions
  }) => {
    var _userPluginOptions$ex, _userPluginOptions$ex2;

    return (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex = userPluginOptions.excludeFields) === null || _userPluginOptions$ex === void 0 ? void 0 : _userPluginOptions$ex.length) || (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex2 = userPluginOptions.excludeFieldNames) === null || _userPluginOptions$ex2 === void 0 ? void 0 : _userPluginOptions$ex2.length);
  },
  processor: ({
    helpers,
    userPluginOptions
  }) => {
    var _userPluginOptions$ex3;

    if (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$ex3 = userPluginOptions.excludeFields) === null || _userPluginOptions$ex3 === void 0 ? void 0 : _userPluginOptions$ex3.length) {
      helpers.reporter.log(``);
      helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)( // @todo
      `\n\nPlugin options excludeFields has been renamed to excludeFieldNames.\nBoth options work for now, but excludeFields will be removed in a future version\n(likely when we get to beta) in favour of excludeFieldNames.\n\n`));
    }

    _store.default.dispatch.remoteSchema.addFieldsToBlackList(userPluginOptions.excludeFieldNames || userPluginOptions.excludeFields);

    return userPluginOptions;
  }
}, {
  name: `queryDepth-is-not-a-positive-int`,
  test: ({
    userPluginOptions
  }) => {
    var _userPluginOptions$sc, _userPluginOptions$sc2, _userPluginOptions$sc3;

    return typeof (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc = userPluginOptions.schema) === null || _userPluginOptions$sc === void 0 ? void 0 : _userPluginOptions$sc.queryDepth) !== `undefined` && (!(0, _isInteger.default)(userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc2 = userPluginOptions.schema) === null || _userPluginOptions$sc2 === void 0 ? void 0 : _userPluginOptions$sc2.queryDepth) || (userPluginOptions === null || userPluginOptions === void 0 ? void 0 : (_userPluginOptions$sc3 = userPluginOptions.schema) === null || _userPluginOptions$sc3 === void 0 ? void 0 : _userPluginOptions$sc3.queryDepth) <= 0);
  },
  processor: ({
    helpers,
    userPluginOptions
  }) => {
    helpers.reporter.log(``);
    helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`\n\npluginOptions.schema.queryDepth is not a positive integer.\nUsing default value in place of provided value.\n`, {
      useVerboseStyle: true
    }));
    delete userPluginOptions.schema.queryDepth;
    return userPluginOptions;
  }
}];

const processAndValidatePluginOptions = (helpers, pluginOptions) => {
  let userPluginOptions = Object.assign({}, pluginOptions);
  optionsProcessors.forEach(({
    test,
    processor,
    name
  }) => {
    if (!name) {
      helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`Plugin option filter is unnamed\n\n${test.toString()}\n\n${processor.toString()}`));
    }

    if (test({
      helpers,
      userPluginOptions
    })) {
      const filteredUserPluginOptions = processor({
        helpers,
        userPluginOptions
      });

      if (filteredUserPluginOptions) {
        userPluginOptions = filteredUserPluginOptions;
      } else {
        helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`Plugin option filter ${name} didn't return a filtered options object`));
      }
    }
  });
  return userPluginOptions;
};

exports.processAndValidatePluginOptions = processAndValidatePluginOptions;