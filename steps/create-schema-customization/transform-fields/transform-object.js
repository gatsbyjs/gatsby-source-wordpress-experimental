"use strict";

exports.__esModule = true;
exports.transformGatsbyNodeObject = exports.buildGatsbyNodeObjectResolver = exports.transformListOfGatsbyNodes = void 0;

var _helpers = require("../helpers");

var _update = require("../../source-nodes/update-nodes/wp-actions/update");

var _helpers2 = require("../../source-nodes/helpers");

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

const transformListOfGatsbyNodes = ({
  field,
  fieldName
}) => {
  const typeName = (0, _helpers.buildTypeName)(field.type.ofType.name);
  return {
    type: `[${typeName}]`,
    resolve: (source, args, context, info) => {
      let nodes = null;
      const field = source[fieldName];

      if (field && Array.isArray(field)) {
        nodes = field;
      } else if (Array.isArray(source === null || source === void 0 ? void 0 : source.nodes)) {
        nodes = source.nodes;
      }

      if (!nodes) {
        return null;
      }

      return context.nodeModel.getNodesByIds({
        ids: nodes.map(node => node === null || node === void 0 ? void 0 : node.id),
        type: typeName
      });
    }
  };
};

exports.transformListOfGatsbyNodes = transformListOfGatsbyNodes;

const buildGatsbyNodeObjectResolver = ({
  field,
  fieldName
}) => async (source, _, context) => {
  const typeName = (0, _helpers.buildTypeName)(field.type.name);
  const nodeField = source[fieldName];

  if (!nodeField || nodeField && !nodeField.id) {
    return null;
  }

  const existingNode = context.nodeModel.getNodeById({
    id: nodeField.id,
    type: typeName
  });

  if (existingNode) {
    return existingNode;
  }

  const queryInfo = (0, _helpers2.getQueryInfoByTypeName)(field.type.name); // if this node doesn't exist, fetch it and create a node

  const {
    node
  } = await (0, _update.fetchAndCreateSingleNode)({
    id: nodeField.id,
    actionType: `CREATE`,
    singleName: queryInfo.typeInfo.singularName
  });

  if (source.id && node) {
    const {
      helpers
    } = (0, _getGatsbyApi.getGatsbyApi)();
    await helpers.actions.createParentChildLink({
      parent: source,
      child: node
    });
  }

  return node || null;
};

exports.buildGatsbyNodeObjectResolver = buildGatsbyNodeObjectResolver;

const transformGatsbyNodeObject = transformerApi => {
  const {
    field
  } = transformerApi;
  const typeName = (0, _helpers.buildTypeName)(field.type.name);
  return {
    type: typeName,
    resolve: buildGatsbyNodeObjectResolver(transformerApi)
  };
};

exports.transformGatsbyNodeObject = transformGatsbyNodeObject;