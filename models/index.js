"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _remoteSchema = _interopRequireDefault(require("./remoteSchema"));

var _gatsbyApi = _interopRequireDefault(require("./gatsby-api"));

var _logger = _interopRequireDefault(require("./logger"));

var _imageNodes = _interopRequireDefault(require("./image-nodes"));

var _wpHooks = _interopRequireDefault(require("./wp-hooks"));

var _default = {
  remoteSchema: _remoteSchema.default,
  gatsbyApi: _gatsbyApi.default,
  logger: _logger.default,
  imageNodes: _imageNodes.default,
  wpHooks: _wpHooks.default
};
exports.default = _default;