"use strict";

exports.__esModule = true;
exports.default = void 0;

var _url = require("url");

var _default = link => (0, _url.parse)(link).pathname;

exports.default = _default;