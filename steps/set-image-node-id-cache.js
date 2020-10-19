"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.setImageNodeIdCache = void 0;

var _store = _interopRequireDefault(require("../store"));

var _cache = require("../utils/cache");

// since we create image nodes in resolvers
// we cache our image node id's on post build for production
// and on create dev server for development
// so we can touch our image nodes in both develop and build
// so they don't get garbage collected by Gatsby
const setImageNodeIdCache = async () => {
  const state = await _store.default.getState();
  const {
    imageNodes,
    gatsbyApi
  } = state;

  if (imageNodes.nodeIds && imageNodes.nodeIds.length) {
    await (0, _cache.setPersistentCache)({
      key: `image-node-ids`,
      value: imageNodes.nodeIds
    });
  }

  if (imageNodes.nodeMetaByUrl) {
    await (0, _cache.setPersistentCache)({
      key: `image-node-meta-by-url`,
      value: imageNodes.nodeMetaByUrl
    });
  }
};

exports.setImageNodeIdCache = setImageNodeIdCache;