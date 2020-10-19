"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _core = require("@rematch/core");

var _immer = _interopRequireDefault(require("@rematch/immer"));

var _models = _interopRequireDefault(require("./models"));

const store = (0, _core.init)({
  models: _models.default,
  plugins: [(0, _immer.default)()]
});
var _default = store;
exports.default = _default;