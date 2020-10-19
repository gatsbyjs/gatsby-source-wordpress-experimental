"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _chalk = _interopRequireDefault(require("chalk"));

var _formatLogMessage = require("../../../../utils/format-log-message");

var _store = _interopRequireDefault(require("../../../../store"));

var _helpers = require("../../../create-schema-customization/helpers");

var _fetchGraphql = require("../../../../utils/fetch-graphql");

var _helpers2 = require("../../helpers");

var _constants = require("../../../../constants");

var _cache = require("../../../../utils/cache");

const wpActionDELETE = async ({
  helpers,
  // cachedNodeIds,
  wpAction
}) => {
  const {
    reporter,
    actions,
    getNode
  } = helpers;

  try {
    let cachedNodeIds = await (0, _cache.getPersistentCache)({
      key: _constants.CREATED_NODE_IDS
    }); // get the node ID from the WPGQL id

    const nodeId = wpAction.referencedNodeGlobalRelayID;
    const node = await getNode(nodeId);
    const {
      typeInfo
    } = (0, _helpers2.getQueryInfoBySingleFieldName)(wpAction.referencedNodeSingularName) || {};

    if (!typeInfo) {
      Object.entries(wpAction).forEach(([key, value]) => reporter.warn(`${key} -> ${value}`));
      reporter.panic((0, _formatLogMessage.formatLogMessage)(`Unable to perform above action. Data may be unsynched. Clear your cache and run the build process again to resync all data.`));
    }

    const typeSettings = (0, _helpers.getTypeSettingsByType)({
      name: typeInfo.nodesTypeName
    });

    if (typeSettings.beforeChangeNode && typeof typeSettings.beforeChangeNode === `function`) {
      const {
        additionalNodeIds
      } = (await typeSettings.beforeChangeNode({
        actionType: `DELETE`,
        remoteNode: node,
        actions,
        helpers,
        typeInfo,
        fetchGraphql: _fetchGraphql.fetchGraphql,
        typeSettings,
        buildTypeName: _helpers.buildTypeName,
        wpStore: _store.default
      })) || {};

      if (additionalNodeIds && additionalNodeIds.length) {
        additionalNodeIds.forEach(id => cachedNodeIds.push(id));
      }
    }

    if (node) {
      await actions.touchNode({
        nodeId
      });
      await actions.deleteNode({
        node
      });
      reporter.log(``);
      reporter.info((0, _formatLogMessage.formatLogMessage)(`${_chalk.default.bold(`deleted ${wpAction.referencedNodeSingularName}`)} ${wpAction.title} (#${wpAction.referencedNodeID})`));
      reporter.log(``);
    } // Remove this from cached node id's so we don't try to touch it


    const validNodeIds = cachedNodeIds.filter(cachedId => cachedId !== nodeId);
    await (0, _cache.setPersistentCache)({
      key: _constants.CREATED_NODE_IDS,
      value: validNodeIds
    }); // return validNodeIds
  } catch (e) {
    Object.entries(wpAction).forEach(([key, value]) => {
      reporter.warn(`${key} ${JSON.stringify(value)}`);
    });
    throw Error(e);
  }
};

module.exports = wpActionDELETE;