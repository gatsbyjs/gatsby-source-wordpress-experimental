"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.cacheFetchedTypes = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _cache = require("../../utils/cache");

const cacheFetchedTypes = async () => {
  const state = _store.default.getState();

  const {
    fetchedTypes
  } = state.remoteSchema;
  await (0, _cache.setPersistentCache)({
    key: `previously-fetched-types`,
    value: Array.from([...fetchedTypes])
  });
};

exports.cacheFetchedTypes = cacheFetchedTypes;