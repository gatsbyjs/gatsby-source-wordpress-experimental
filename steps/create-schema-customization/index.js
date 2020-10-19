"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createSchemaCustomization = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _helpers = require("./helpers");

var _buildTypes = _interopRequireDefault(require("./build-types"));

var _fetchNodes = require("../source-nodes/fetch-nodes/fetch-nodes");

var _isExcluded = require("../ingest-remote-schema/is-excluded");

/**
 * createSchemaCustomization
 */
const customizeSchema = async ({
  actions,
  schema
}) => {
  const state = _store.default.getState();

  const {
    gatsbyApi: {
      pluginOptions
    },
    remoteSchema
  } = state;
  const {
    fieldAliases,
    fieldBlacklist,
    ingestibles: {
      nonNodeRootFields
    }
  } = remoteSchema;
  let typeDefs = [];
  const gatsbyNodeTypes = (0, _fetchNodes.getGatsbyNodeTypeNames)();
  const typeBuilderApi = {
    typeDefs,
    schema,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist,
    pluginOptions
  }; // create Gatsby node types

  remoteSchema.introspectionData.__schema.types.forEach(type => {
    if ((0, _helpers.fieldOfTypeWasFetched)(type) && !(0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: type.name
    })) {
      switch (type.kind) {
        case `UNION`:
          _buildTypes.default.unionType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `INTERFACE`:
          _buildTypes.default.interfaceType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `OBJECT`:
          _buildTypes.default.objectType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `ENUM`:
          _buildTypes.default.enumType(Object.assign({}, typeBuilderApi, {
            type
          }));

          break;

        case `SCALAR`:
          /**
           * custom scalar types aren't imlemented currently.
           *  @todo make this hookable so sub-plugins or plugin options can add custom scalar support.
           */
          break;
      }
    }
  }); // Create non Gatsby node types by creating a single node
  // where the typename is the type prefix
  // The node fields are the non-node root fields of the remote schema
  // like so: query { prefix { ...fields } }


  _buildTypes.default.objectType(Object.assign({}, typeBuilderApi, {
    type: {
      kind: `OBJECT`,
      name: pluginOptions.schema.typePrefix,
      description: `Non-node WPGraphQL root fields.`,
      fields: nonNodeRootFields,
      interfaces: [`Node`]
    },
    isAGatsbyNode: true
  }));

  actions.createTypes(typeDefs);
};

const createSchemaCustomization = async api => {
  try {
    await customizeSchema(api);
  } catch (e) {
    api.reporter.panic(e);
  }
};

exports.createSchemaCustomization = createSchemaCustomization;