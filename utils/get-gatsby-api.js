"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getGatsbyApi = exports.getHelpers = exports.getPluginOptions = void 0;

var _store = _interopRequireDefault(require("../store"));

const getPluginOptions = () => _store.default.getState().gatsbyApi.pluginOptions;

exports.getPluginOptions = getPluginOptions;

const getHelpers = () => _store.default.getState().gatsbyApi.helpers;

exports.getHelpers = getHelpers;

const getGatsbyApi = () => _store.default.getState().gatsbyApi;

exports.getGatsbyApi = getGatsbyApi;