"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.persistPreviouslyCachedImages = void 0;

var _store = _interopRequireDefault(require("../store"));

var _getGatsbyApi = require("../utils/get-gatsby-api");

var _cache = require("../utils/cache");

const persistPreviouslyCachedImages = async () => {
  const {
    helpers
  } = (0, _getGatsbyApi.getGatsbyApi)(); // load up image node id's from cache

  const imageNodeIds = await (0, _cache.getPersistentCache)({
    key: `image-node-ids`
  }); // if they exist,

  if (imageNodeIds && imageNodeIds.length) {
    // touch them all so they don't get garbage collected by Gatsby
    imageNodeIds.forEach(nodeId => helpers.actions.touchNode({
      nodeId
    })); // and set them to state to set back to cache later
    // since we may append more image id's to the store down the line
    // in onPostBuild, all imageNodeIds in state are cached for the next build

    _store.default.dispatch.imageNodes.setNodeIds(imageNodeIds);
  }

  const imageNodeMetaByUrl = await (0, _cache.getPersistentCache)({
    key: `image-node-meta-by-url`
  });

  if (imageNodeMetaByUrl) {
    _store.default.dispatch.imageNodes.setState({
      nodeMetaByUrl: imageNodeMetaByUrl
    });
  }
};

exports.persistPreviouslyCachedImages = persistPreviouslyCachedImages;