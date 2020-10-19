"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.addNodeFilter = exports.applyNodeFilter = void 0;

var _store = _interopRequireDefault(require("../store"));

/**
 * Grabs an array of filter functions from the redux store,
 * orders them by priority, and then runs each in order over the
 * passed in data. The modified data is then returned
 *
 * @param {string} name The name of the filter to apply
 * @param {object} context Any additional data to pass to the filter functions that are applied
 * @param {object} data The initial data to be filtered
 */
const applyNodeFilter = async ({
  name,
  context,
  data
}) => {
  var _store$getState$wpHoo;

  if (!name) {
    return data;
  }

  const nodeFilters = (_store$getState$wpHoo = _store.default.getState().wpHooks.nodeFilters) === null || _store$getState$wpHoo === void 0 ? void 0 : _store$getState$wpHoo[name];

  if (!nodeFilters || !nodeFilters.length) {
    return data;
  }

  const sortedNodeFilters = nodeFilters.sort((a, b) => a.priority - b.priority);

  for (const {
    filter
  } of sortedNodeFilters) {
    data = filter({
      data,
      context,
      name
    });
  }

  return data;
};
/**
 * This function adds a filter to the internal redux store of filters
 * To be applied via applyNodeFilter above
 *
 * @param {string} name The name of the filter
 * @param {function} filter The function to run when applying this filter
 * @param {integer} priority The priority for this filter to run in. lower means earlier execution
 */


exports.applyNodeFilter = applyNodeFilter;

const addNodeFilter = ({
  name,
  filter,
  priority
}) => _store.default.dispatch.wpHooks.addNodeFilter({
  name,
  filter,
  priority
});

exports.addNodeFilter = addNodeFilter;