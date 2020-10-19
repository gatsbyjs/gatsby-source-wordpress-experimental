"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.formatLogMessage = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _store = _interopRequireDefault(require("../store"));

const formatLogMessage = (input, {
  useVerboseStyle
} = {}) => {
  let verbose = false;

  if (typeof useVerboseStyle === `undefined`) {
    verbose = _store.default.getState().gatsbyApi.pluginOptions.verbose;
  }

  let message;

  if (typeof input === `string`) {
    message = input;
  } else {
    message = input[0];
  }

  return verbose || useVerboseStyle ? `${_chalk.default.bgBlue.white(` gatsby-source-wordpress `)} ${message}` : `[gatsby-source-wordpress] ${message}`;
};

exports.formatLogMessage = formatLogMessage;