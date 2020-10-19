"use strict";

exports.__esModule = true;
exports.default = void 0;

var _fetchReferencedMediaItems = require("../steps/source-nodes/fetch-nodes/fetch-referenced-media-items");

const imageNodes = {
  state: {
    nodeMetaByUrl: {},
    nodeIds: []
  },
  reducers: {
    setState(state, payload) {
      state = Object.assign({}, state, payload);
      return state;
    },

    setNodeIds(_, payload) {
      return {
        nodeIds: payload
      };
    },

    pushNodeMeta(state, {
      id,
      sourceUrl,
      modifiedGmt
    }) {
      state.nodeIds.push(id);
      const nodeUrl = (0, _fetchReferencedMediaItems.stripImageSizesFromUrl)(sourceUrl); // dont overwrite the lookup table in case we have multiple
      // sized urls for the same image

      if (!state.nodeMetaByUrl[nodeUrl]) {
        state.nodeMetaByUrl[nodeUrl] = {
          id,
          modifiedGmt
        };
      }

      return state;
    }

  }
};
var _default = imageNodes;
exports.default = _default;