"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.fetchAndRunWpActions = exports.handleWpActions = exports.getWpActions = void 0;

var _graphqlQueries = require("../../../../utils/graphql-queries");

var _delete = _interopRequireDefault(require("./delete"));

var _update = _interopRequireDefault(require("./update"));

var _constants = require("../../../../constants");

var _fetchNodesPaginated = require("../../fetch-nodes/fetch-nodes-paginated");

var _fetchAndCreateNonNodeRootFields = _interopRequireDefault(require("../../create-nodes/fetch-and-create-non-node-root-fields"));

var _cache = require("../../../../utils/cache");

const previouslyFetchedActionIds = [];
/**
 * getWpActions
 *
 * pull the latest changes from WP and determine which of those changes
 * require updates in Gatsby, then return valid changes
 * An example of a non-valid change would be a post that was created
 * and then immediately deleted.
 */

const getWpActions = async ({
  variables,
  helpers,
  throwFetchErrors = false,
  throwGqlErrors = false
}) => {
  // current time minus 5 seconds so we don't lose updates between the cracks
  // if someone bulk-edits a list of nodes in WP
  // @todo make this cursor based so we don't need to do this.
  // give me changes since x change. if x change doesn't exist,
  // then we need to fetch everything
  const sourceTime = Date.now() - 5000; // @todo add pagination in case there are more than 100 actions since the last build

  const actionMonitorActions = await (0, _fetchNodesPaginated.paginatedWpNodeFetch)(Object.assign({
    contentTypePlural: `actionMonitorActions`,
    query: _graphqlQueries.actionMonitorQuery,
    nodeTypeName: `ActionMonitor`,
    helpers,
    throwFetchErrors,
    throwGqlErrors
  }, variables));

  if (!actionMonitorActions || !actionMonitorActions.length) {
    return [];
  }

  const actionsSinceLastUpdate = actionMonitorActions.filter( // remove any actions that were fetched in the last run
  // (only needed in develop but doesn't hurt in production as previouslyFetchedActionIds will always be empty in prod)
  ({
    id
  }) => !previouslyFetchedActionIds.includes(id)); // store these action ids so we don't run them again if we're interval refetching

  actionsSinceLastUpdate.forEach(({
    id
  }) => previouslyFetchedActionIds.push(id));
  await helpers.cache.set(_constants.LAST_COMPLETED_SOURCE_TIME, sourceTime); // @todo - rework this logic, and make sure it works as expected in all cases.
  // we only want to use the latest action on each post ID in case multiple
  // actions were recorded for the same post
  // for example: if a post was deleted and then immediately published again.
  // if we kept both actions we would download the node and then delete it
  // Since we receive the actions in order from newest to oldest, we
  // can prefer actions at the top of the list.

  const actionabledIds = [];
  const actions = actionsSinceLastUpdate.filter(action => {
    const id = action.referencedNodeGlobalRelayID; // check if an action with the same id exists

    const actionExists = actionabledIds.find(actionableId => actionableId === id); // if there isn't one, record the id of this one to filter
    // out further actions with the same id

    if (!actionExists) {
      actionabledIds.push(id);
    } // just keep the action if one doesn't already exist


    return !actionExists;
  });
  return actions;
};
/**
 * Acts on changes in WordPress to call functions that sync Gatsby with
 * the latest WP changes
 */


exports.getWpActions = getWpActions;

const handleWpActions = async api => {
  let {
    cachedNodeIds,
    helpers
  } = api;

  switch (api.wpAction.actionType) {
    case `DELETE`:
      await (0, _delete.default)(api);
      break;

    case `UPDATE`:
    case `CREATE`:
      await (0, _update.default)(api);
      break;

    case `NON_NODE_ROOT_FIELDS`:
      await (0, _fetchAndCreateNonNodeRootFields.default)();
  }

  await (0, _cache.setHardCachedNodes)({
    helpers
  });
  return cachedNodeIds;
};
/**
 * fetchAndRunWpActions
 *
 * fetches a list of latest changes in WordPress
 * and then acts on those changes
 */


exports.handleWpActions = handleWpActions;

const fetchAndRunWpActions = async ({
  helpers,
  pluginOptions,
  intervalRefetching,
  since,
  throwFetchErrors = false,
  throwGqlErrors = false
}) => {
  // check for new, edited, or deleted posts in WP "Action Monitor"
  const wpActions = await getWpActions({
    variables: {
      since
    },
    helpers,
    throwFetchErrors,
    throwGqlErrors
  });
  const didUpdate = !!wpActions.length;

  if (didUpdate) {
    for (const wpAction of wpActions) {
      // Create, update, and delete nodes
      await handleWpActions({
        helpers,
        pluginOptions,
        intervalRefetching,
        wpAction
      });
    }
  }

  return {
    wpActions,
    didUpdate
  };
};

exports.fetchAndRunWpActions = fetchAndRunWpActions;