"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.paginatedWpNodeFetch = exports.normalizeNode = void 0;

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _fetchGraphql = _interopRequireDefault(require("../../../utils/fetch-graphql"));

var _store = _interopRequireDefault(require("../../../store"));

var _formatLogMessage = require("../../../utils/format-log-message");

const normalizeNode = ({
  node,
  nodeTypeName
}) => {
  const normalizedNodeTypeName = node.__typename || nodeTypeName; // @todo is node.type used anywhere??

  node.type = normalizedNodeTypeName; // this is used to filter node interfaces by content types

  node.nodeType = normalizedNodeTypeName;
  return node;
};
/**
 * paginatedWpNodeFetch
 *
 * recursively fetches/paginates remote nodes
 */


exports.normalizeNode = normalizeNode;

const paginatedWpNodeFetch = async (_ref) => {
  var _data$contentTypePlur;

  let {
    contentTypePlural,
    query,
    nodeTypeName,
    helpers,
    throwFetchErrors = false,
    throwGqlErrors = false,
    allContentNodes = [],
    after = null,
    settings = {}
  } = _ref,
      variables = (0, _objectWithoutPropertiesLoose2.default)(_ref, ["contentTypePlural", "query", "nodeTypeName", "helpers", "throwFetchErrors", "throwGqlErrors", "allContentNodes", "after", "settings"]);

  if (!settings.limit && typeof settings.limit === `number` && settings.limit === 0) {
    // if the Type.limit plugin option is set to the number 0,
    // we shouldn't fetch anything
    return [];
  }

  if (settings.limit && // if we're about to fetch more than our limit
  allContentNodes.length + variables.first > settings.limit) {
    // just fetch whatever number is remaining
    variables.first = settings.limit - allContentNodes.length;
  } // if the GQL var "first" is greater than our Type.limit plugin option,
  // that's no good


  if (settings.limit && settings.limit < variables.first) {
    // so just fetch our limit
    variables.first = settings.limit;
  }

  const errorContext = `Error occured while fetching nodes of the "${nodeTypeName}" type.`;
  const response = await (0, _fetchGraphql.default)({
    query,
    throwFetchErrors,
    throwGqlErrors,
    variables: Object.assign({}, variables, {
      after
    }),
    errorContext
  });
  const {
    data
  } = response;

  if (!(data === null || data === void 0 ? void 0 : (_data$contentTypePlur = data[contentTypePlural]) === null || _data$contentTypePlur === void 0 ? void 0 : _data$contentTypePlur.nodes)) {
    return allContentNodes;
  }

  let {
    [contentTypePlural]: {
      nodes,
      pageInfo: {
        hasNextPage,
        endCursor
      } = {}
    }
  } = data; // Sometimes private posts return as null.
  // That causes problems for us so let's strip them out

  nodes = nodes.filter(Boolean);

  if (nodes && nodes.length) {
    nodes.forEach(node => {
      node = normalizeNode({
        node,
        nodeTypeName
      });
      allContentNodes.push(node);
    }); // MediaItem type is incremented in createMediaItemNode

    if (nodeTypeName !== `MediaItem`) {
      _store.default.dispatch.logger.incrementActivityTimer({
        typeName: nodeTypeName,
        by: nodes.length
      });
    }
  }

  if (hasNextPage && endCursor && (!settings.limit || settings.limit > allContentNodes.length)) {
    return paginatedWpNodeFetch(Object.assign({}, variables, {
      contentTypePlural,
      nodeTypeName,
      query,
      allContentNodes,
      helpers,
      settings,
      after: endCursor
    }));
  } else {
    return allContentNodes;
  }
};

exports.paginatedWpNodeFetch = paginatedWpNodeFetch;