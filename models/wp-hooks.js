"use strict";

exports.__esModule = true;
exports.default = void 0;
const wpHooks = {
  state: {
    nodeFilters: {}
  },
  reducers: {
    addNodeFilter(state, nodeFilter) {
      var _state$nodeFilters;

      const {
        name,
        filter,
        priority = 10
      } = nodeFilter;

      if (!name || typeof filter === `undefined`) {
        return state;
      }

      state.nodeFilters[nodeFilter.name] = [...(((_state$nodeFilters = state.nodeFilters) === null || _state$nodeFilters === void 0 ? void 0 : _state$nodeFilters[nodeFilter.name]) || []), {
        name,
        filter,
        priority
      }];
      return state;
    }

  }
};
var _default = wpHooks;
exports.default = _default;