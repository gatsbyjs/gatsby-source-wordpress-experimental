"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.fetchAndCreateAllNodes = exports.fetchWPGQLContentNodesByContentType = exports.runFnForEachNodeQuery = exports.getGatsbyNodeTypeNames = exports.getContentTypeQueryInfos = exports.fetchWPGQLContentNodes = void 0;

var _createNodes = require("../create-nodes/create-nodes");

var _fetchNodesPaginated = require("./fetch-nodes-paginated");

var _formatLogMessage = require("../../../utils/format-log-message");

var _constants = require("../../../constants");

var _store = _interopRequireDefault(require("../../../store"));

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

var _chunk = _interopRequireDefault(require("lodash/chunk"));

var _cache = require("../../../utils/cache");

/**
 * fetchWPGQLContentNodes
 *
 * fetches and paginates remote nodes by post type while reporting progress
 */
const fetchWPGQLContentNodes = async ({
  queryInfo
}) => {
  const {
    pluginOptions,
    helpers
  } = _store.default.getState().gatsbyApi;

  const {
    reporter
  } = helpers;
  const {
    url,
    schema: {
      perPage
    }
  } = pluginOptions;
  const {
    nodeListQueries,
    typeInfo,
    settings
  } = queryInfo;
  const typeName = typeInfo.nodesTypeName;

  _store.default.dispatch.logger.createActivityTimer({
    typeName,
    pluginOptions,
    reporter
  });

  let allNodesOfContentType = []; // there's normally just one query here, but more can be added using the settings.nodeListQueries api

  for (const nodeListQuery of nodeListQueries) {
    let contentNodes = await (0, _fetchNodesPaginated.paginatedWpNodeFetch)({
      first: perPage,
      after: null,
      contentTypePlural: typeInfo.pluralName,
      nodeTypeName: typeInfo.nodesTypeName,
      query: nodeListQuery,
      url,
      settings,
      helpers
    });
    allNodesOfContentType = [...allNodesOfContentType, ...contentNodes];
  }

  _store.default.dispatch.logger.stopActivityTimer({
    typeName
  });

  if (allNodesOfContentType && allNodesOfContentType.length) {
    return {
      singular: queryInfo.typeInfo.singularName,
      plural: queryInfo.typeInfo.pluralName,
      allNodesOfContentType
    };
  }

  return false;
};
/**
 * getContentTypeQueryInfos
 *
 * returns query infos (Type info & GQL query strings) filtered to
 * remove types that are excluded in the plugin options
 *
 * @returns {Array} Type info & GQL query strings
 */


exports.fetchWPGQLContentNodes = fetchWPGQLContentNodes;

const getContentTypeQueryInfos = () => {
  const {
    nodeQueries
  } = _store.default.getState().remoteSchema;

  const queryInfos = Object.values(nodeQueries).filter(({
    settings
  }) => !settings.exclude);
  return queryInfos;
};

exports.getContentTypeQueryInfos = getContentTypeQueryInfos;

const getGatsbyNodeTypeNames = () => {
  const {
    typeMap
  } = _store.default.getState().remoteSchema;

  const queryableTypenames = getContentTypeQueryInfos().map(query => query.typeInfo.nodesTypeName);
  const implementingNodeTypes = queryableTypenames.reduce((accumulator, typename) => {
    var _type$possibleTypes;

    const type = typeMap.get(typename);

    if ((_type$possibleTypes = type.possibleTypes) === null || _type$possibleTypes === void 0 ? void 0 : _type$possibleTypes.length) {
      accumulator = [...accumulator, ...type.possibleTypes.map(({
        name
      }) => name)];
    }

    return accumulator;
  }, []);
  return [...new Set([...queryableTypenames, ...implementingNodeTypes])];
};
/**
 * fetchWPGQLContentNodesByContentType
 *
 * fetches nodes from the remote WPGQL server and groups them by post type
 *
 * @returns {Array}
 */


exports.getGatsbyNodeTypeNames = getGatsbyNodeTypeNames;

const runFnForEachNodeQuery = async fn => {
  const nodeQueries = getContentTypeQueryInfos();
  const chunkSize = process.env.GATSBY_CONCURRENT_DOWNLOAD || 50;
  const chunkedQueries = (0, _chunk.default)(nodeQueries, chunkSize);

  for (const queries of chunkedQueries) {
    await Promise.all(queries.map(async queryInfo => {
      if ( // if the type settings call for lazyNodes, don't fetch them upfront here
      queryInfo.settings.lazyNodes || // if this is a media item and the nodes aren't lazy, we only want to fetch referenced nodes, so we don't fetch all of them here.
      !queryInfo.settings.lazyNodes && queryInfo.typeInfo.nodesTypeName === `MediaItem`) {
        return;
      }

      await fn({
        queryInfo
      });
    }));
  }
};

exports.runFnForEachNodeQuery = runFnForEachNodeQuery;

const fetchWPGQLContentNodesByContentType = async () => {
  const contentNodeGroups = [];
  await runFnForEachNodeQuery(async ({
    queryInfo
  }) => {
    const contentNodeGroup = await fetchWPGQLContentNodes({
      queryInfo
    });

    if (contentNodeGroup) {
      contentNodeGroups.push(contentNodeGroup);
    }
  });
  return contentNodeGroups;
};
/**
 * fetchAndCreateAllNodes
 *
 * uses query info (generated from introspection in onPreBootstrap) to
 * fetch and create Gatsby nodes from any lists of nodes in the remote schema
 */


exports.fetchWPGQLContentNodesByContentType = fetchWPGQLContentNodesByContentType;

const fetchAndCreateAllNodes = async () => {
  const {
    helpers,
    pluginOptions
  } = (0, _getGatsbyApi.getGatsbyApi)();
  const {
    reporter
  } = helpers; //
  // fetch nodes from WPGQL

  const activity = reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`fetching nodes`));
  activity.start();

  _store.default.subscribe(() => {
    activity.setStatus(`${_store.default.getState().logger.entityCount} total`);
  });

  let createdNodeIds;
  const hardCachedNodes = await (0, _cache.getHardCachedNodes)();

  if (!hardCachedNodes) {
    const wpgqlNodesByContentType = await fetchWPGQLContentNodesByContentType();
    const createNodesActivity = reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`creating nodes`));
    createNodesActivity.start(); //
    // Create Gatsby nodes from WPGQL response

    createdNodeIds = await (0, _createNodes.createGatsbyNodesFromWPGQLContentNodes)({
      wpgqlNodesByContentType,
      createNodesActivity
    });
    await (0, _cache.setHardCachedNodes)({
      helpers
    });
    createNodesActivity.end();
    activity.end();
  } else if (hardCachedNodes) {
    createdNodeIds = await (0, _cache.restoreHardCachedNodes)({
      hardCachedNodes
    });
  } // save the node id's so we can touch them on the next build
  // so that we don't have to refetch all nodes


  await (0, _cache.setPersistentCache)({
    key: _constants.CREATED_NODE_IDS,
    value: createdNodeIds
  });
};

exports.fetchAndCreateAllNodes = fetchAndCreateAllNodes;