"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createGatsbyNodesFromWPGQLContentNodes = exports.createNodeWithSideEffects = void 0;

var _pQueue = _interopRequireDefault(require("p-queue"));

var _fetchReferencedMediaItems = _interopRequireDefault(require("../fetch-nodes/fetch-referenced-media-items"));

var _urlToPath = _interopRequireDefault(require("../../../utils/url-to-path"));

var _store = _interopRequireDefault(require("../../../store"));

var _fetchGraphql = _interopRequireDefault(require("../../../utils/fetch-graphql"));

var _helpers = require("../../create-schema-customization/helpers");

var _processNode = require("./process-node");

// @todo concurrency is currently set so low because side effects can overwhelm
// the remote server. A queue for the entire source plugin should be created so that
// everything can share a queue and we can speed some of these things up
const createNodesQueue = new _pQueue.default({
  concurrency: 2
});

const createNodeWithSideEffects = ({
  node,
  state,
  wpgqlNodesGroup = null,
  referencedMediaItemNodeIds = new Set(),
  createdNodeIds = [],
  createNodesActivity = null,
  totalSideEffectNodes = null,
  type = null
}) => async () => {
  const {
    wpUrl
  } = state.remoteSchema;
  const {
    helpers,
    pluginOptions
  } = state.gatsbyApi;
  const {
    actions,
    createContentDigest
  } = helpers;

  if (node.link) {
    // @todo is this still necessary? I don't think it is but double check
    // create a pathname for the node using the WP permalink
    node.path = (0, _urlToPath.default)(node.link);
  }

  if ((wpgqlNodesGroup === null || wpgqlNodesGroup === void 0 ? void 0 : wpgqlNodesGroup.plural) !== `mediaItems`) {
    node = await (0, _processNode.processNode)({
      node,
      pluginOptions,
      referencedMediaItemNodeIds,
      wpUrl,
      helpers
    });
  }

  let remoteNode = Object.assign({}, node, {
    id: node.id,
    parent: null,
    internal: {
      contentDigest: createContentDigest(node),
      type: type || (0, _helpers.buildTypeName)(node.type)
    }
  });
  const typeSettings = (0, _helpers.getTypeSettingsByType)({
    name: node.type
  });

  if (typeof (typeSettings === null || typeSettings === void 0 ? void 0 : typeSettings.beforeChangeNode) === `function`) {
    const {
      additionalNodeIds,
      remoteNode: changedRemoteNode
    } = (await typeSettings.beforeChangeNode({
      actionType: `CREATE_ALL`,
      remoteNode,
      actions,
      helpers,
      type: node.type,
      fetchGraphql: _fetchGraphql.default,
      typeSettings,
      buildTypeName: _helpers.buildTypeName,
      wpStore: _store.default
    })) || {};

    if (changedRemoteNode) {
      remoteNode = changedRemoteNode;
    }

    if ((additionalNodeIds === null || additionalNodeIds === void 0 ? void 0 : additionalNodeIds.length) && totalSideEffectNodes) {
      additionalNodeIds.forEach(id => createdNodeIds.push(id) && totalSideEffectNodes.push(id));
    }

    if (totalSideEffectNodes && typeof (totalSideEffectNodes === null || totalSideEffectNodes === void 0 ? void 0 : totalSideEffectNodes.length) === `number` && totalSideEffectNodes.length > 0 && createNodesActivity) {
      createNodesActivity.setStatus(`awaiting async side effects - ${totalSideEffectNodes.length} additional nodes fetched`);
    }
  }

  await actions.createNode(remoteNode);
  createdNodeIds.push(node.id);
};

exports.createNodeWithSideEffects = createNodeWithSideEffects;

const createGatsbyNodesFromWPGQLContentNodes = async ({
  wpgqlNodesByContentType,
  createNodesActivity
}) => {
  const state = _store.default.getState();

  const {
    helpers,
    pluginOptions
  } = state.gatsbyApi;
  const {
    reporter
  } = helpers; // wp supports these file extensions
  // jpeg|jpg|png|gif|ico|pdf|doc|docx|ppt|pptx|pps|ppsx|odt|xls|psd|mp3|m4a|ogg|wav|mp4|m4v|mov|wmv|avi|mpg|ogv|3gp|3g2|svg|bmp|tif|tiff|asf|asx|wm|wmx|divx|flv|qt|mpe|webm|mkv|txt|asc|c|cc|h|csv|tsv|ics|rtx|css|htm|html|m4b|ra|ram|mid|midi|wax|mka|rtf|js|swf|class|tar|zip|gz|gzip|rar|7z|exe|pot|wri|xla|xlt|xlw|mdb|mpp|docm|dotx|dotm|xlsm|xlsb|xltx|xltm|xlam|pptm|ppsm|potx|potm|ppam|sldx|sldm|onetoc|onetoc2|onetmp|onepkg|odp|ods|odg|odc|odb|odf|wp|wpd|key|numbers|pages
  // gatsby-image supports these file types
  // const imgSrcRemoteFileRegex = /<img.*?src=\\"(.*?jpeg|jpg|png|webp|tif|tiff$)\\"[^>]+>/gim

  _store.default.dispatch.logger.createActivityTimer({
    typeName: `MediaItem`,
    pluginOptions,
    reporter
  });

  const createdNodeIds = [];
  const totalSideEffectNodes = [];
  const referencedMediaItemNodeIds = new Set();

  for (const wpgqlNodesGroup of wpgqlNodesByContentType) {
    const wpgqlNodes = wpgqlNodesGroup.allNodesOfContentType;

    for (const node of wpgqlNodes.values()) {
      createNodesQueue.add(createNodeWithSideEffects({
        state,
        node,
        wpgqlNodesGroup,
        referencedMediaItemNodeIds,
        createdNodeIds,
        createNodesActivity,
        totalSideEffectNodes
      }));
    }
  }

  await createNodesQueue.onIdle();
  const referencedMediaItemNodeIdsArray = [...referencedMediaItemNodeIds];
  /**
   * if we're not lazy fetching media items, we need to fetch them
   * upfront here
   */

  if (!pluginOptions.type.MediaItem.lazyNodes && referencedMediaItemNodeIdsArray.length) {
    await (0, _fetchReferencedMediaItems.default)({
      referencedMediaItemNodeIds: referencedMediaItemNodeIdsArray
    });

    _store.default.dispatch.logger.stopActivityTimer({
      typeName: `MediaItem`
    });

    return [...createdNodeIds, ...referencedMediaItemNodeIdsArray];
  }

  _store.default.dispatch.logger.stopActivityTimer({
    typeName: `MediaItem`
  });

  return createdNodeIds;
};

exports.createGatsbyNodesFromWPGQLContentNodes = createGatsbyNodesFromWPGQLContentNodes;