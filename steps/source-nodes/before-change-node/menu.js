"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.menuBeforeChangeNode = void 0;

var _pQueue = _interopRequireDefault(require("p-queue"));

var _processNode = require("../create-nodes/process-node");

var _process$env$GATSBY_C;

const menuItemFetchQueue = new _pQueue.default({
  concurrency: Number((_process$env$GATSBY_C = process.env.GATSBY_CONCURRENT_DOWNLOAD) !== null && _process$env$GATSBY_C !== void 0 ? _process$env$GATSBY_C : 200),
  carryoverConcurrencyCount: true
});

const fetchChildMenuItems = api => async () => {
  var _remoteNode$menuItems, _remoteNode$menuItems2, _remoteNode$childItem, _remoteNode$childItem2;

  const {
    remoteNode,
    wpStore,
    fetchGraphql,
    helpers,
    actions,
    buildTypeName,
    additionalNodeIds
  } = api;

  if (!(remoteNode === null || remoteNode === void 0 ? void 0 : (_remoteNode$menuItems = remoteNode.menuItems) === null || _remoteNode$menuItems === void 0 ? void 0 : (_remoteNode$menuItems2 = _remoteNode$menuItems.nodes) === null || _remoteNode$menuItems2 === void 0 ? void 0 : _remoteNode$menuItems2.length) && !(remoteNode === null || remoteNode === void 0 ? void 0 : (_remoteNode$childItem = remoteNode.childItems) === null || _remoteNode$childItem === void 0 ? void 0 : (_remoteNode$childItem2 = _remoteNode$childItem.nodes) === null || _remoteNode$childItem2 === void 0 ? void 0 : _remoteNode$childItem2.length)) {
    // if we don't have any child menu items to fetch, skip out
    return;
  }

  const state = wpStore.getState();
  const {
    selectionSet
  } = state.remoteSchema.nodeQueries.menuItems;
  const {
    wpUrl
  } = state.remoteSchema;
  const {
    pluginOptions
  } = state.gatsbyApi;
  const query =
  /* GraphQL */
  `
    fragment MENU_ITEM_FIELDS on MenuItem {
      ${selectionSet}
    }

    query {
      ${(remoteNode.menuItems || remoteNode.childItems).nodes.map(({
    id
  }, index) => `id__${index}: menuItem(id: "${id}") { ...MENU_ITEM_FIELDS }`).join(` `)}
    }`;
  const {
    data
  } = await fetchGraphql({
    query,
    errorContext: `Error occured while recursively fetching "MenuItem" nodes in Menu beforeChangeNode API.`
  });
  const remoteChildMenuItemNodes = Object.values(data);
  remoteChildMenuItemNodes.forEach(({
    id
  } = {}) => id && additionalNodeIds.push(id));
  await Promise.all(remoteChildMenuItemNodes.map(async remoteMenuItemNode => {
    // recursively fetch child menu items
    menuItemFetchQueue.add(fetchChildMenuItems(Object.assign({}, api, {
      remoteNode: remoteMenuItemNode
    })));
    const type = buildTypeName(`MenuItem`);
    const processedNode = await (0, _processNode.processNode)({
      node: remoteMenuItemNode,
      pluginOptions,
      wpUrl,
      helpers
    });
    await actions.createNode(Object.assign({}, processedNode, {
      nodeType: `MenuItem`,
      type: `MenuItem`,
      parent: null,
      internal: {
        contentDigest: helpers.createContentDigest(remoteMenuItemNode),
        type
      }
    }));
  }));
};

const menuBeforeChangeNode = async api => {
  if (api.actionType !== `UPDATE` && api.actionType !== `CREATE`) {
    // no need to update child MenuItems if we're not updating an existing menu
    // if we're creating a new menu it will be empty initially.
    return null;
  }

  let additionalNodeIds = [];
  menuItemFetchQueue.add(fetchChildMenuItems(Object.assign({}, api, {
    additionalNodeIds
  })));
  await menuItemFetchQueue.onIdle();
  return {
    additionalNodeIds
  };
};

exports.menuBeforeChangeNode = menuBeforeChangeNode;