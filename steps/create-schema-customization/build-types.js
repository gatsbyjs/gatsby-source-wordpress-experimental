"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _transformFields = require("./transform-fields");

var _isExcluded = require("../ingest-remote-schema/is-excluded");

var _helpers = require("./helpers");

const unionType = typeBuilderApi => {
  const {
    typeDefs,
    schema,
    type,
    pluginOptions
  } = typeBuilderApi;
  const types = type.possibleTypes.filter(possibleType => !(0, _isExcluded.typeIsExcluded)({
    pluginOptions,
    typeName: possibleType.name
  })).map(possibleType => (0, _helpers.buildTypeName)(possibleType.name));

  if (!types || !types.length) {
    return;
  }

  let unionType = {
    name: (0, _helpers.buildTypeName)(type.name),
    types,
    resolveType: node => {
      if (node.type) {
        return (0, _helpers.buildTypeName)(node.type);
      }

      if (node.__typename) {
        return (0, _helpers.buildTypeName)(node.__typename);
      }

      return null;
    },
    extensions: {
      infer: false
    }
  }; // @todo add this as a plugin option

  unionType = (0, _helpers.filterTypeDefinition)(unionType, typeBuilderApi, `UNION`);
  typeDefs.push(schema.buildUnionType(unionType));
};

const interfaceType = typeBuilderApi => {
  const {
    type,
    typeDefs,
    schema,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist
  } = typeBuilderApi;

  const state = _store.default.getState();

  const {
    ingestibles,
    typeMap
  } = state.remoteSchema;
  const {
    nodeInterfaceTypes
  } = ingestibles;
  const allTypes = typeMap.values();
  const implementingTypes = Array.from(allTypes).filter(({
    interfaces
  }) => interfaces && // find types that implement this interface type
  interfaces.find(singleInterface => singleInterface.name === type.name)).map(type => typeMap.get(type.name)).filter(type => type.kind !== `UNION` || // if this is a union type, make sure the union type has one or more member types, otherwise schema customization will throw an error
  !!type.possibleTypes && !!type.possibleTypes.length);
  const transformedFields = (0, _transformFields.transformFields)({
    parentInterfacesImplementingTypes: implementingTypes,
    fields: type.fields,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist
  });
  let typeDef = {
    name: (0, _helpers.buildTypeName)(type.name),
    fields: transformedFields,
    extensions: {
      infer: false
    }
  }; // if this is a node interface type

  if (nodeInterfaceTypes.includes(type.name)) {
    // we add nodeType (post type) to all nodes as they're fetched
    // so we can add them to node interfaces as well in order to filter
    // by a couple different content types
    typeDef.fields[`nodeType`] = `String`;
    typeDef.extensions.nodeInterface = {};
  } else {
    // otherwise this is a regular interface type so we need to resolve the type name
    typeDef.resolveType = node => node && node.__typename ? (0, _helpers.buildTypeName)(node.__typename) : null;
  } // @todo add this as a plugin option


  typeDef = (0, _helpers.filterTypeDefinition)(typeDef, typeBuilderApi, `INTERFACE`);
  typeDefs.push(schema.buildInterfaceType(typeDef));
};

const objectType = typeBuilderApi => {
  var _type$interfaces;

  const {
    type,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist,
    typeDefs,
    schema,
    isAGatsbyNode
  } = typeBuilderApi;
  const transformedFields = (0, _transformFields.transformFields)({
    fields: type.fields,
    parentType: type,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist
  }); // if all child fields are excluded, this type shouldn't exist.

  if (!Object.keys(transformedFields).length) {
    return;
  }

  let objectType = {
    name: (0, _helpers.buildTypeName)(type.name),
    fields: transformedFields,
    extensions: {
      infer: false
    }
  };

  if (type.interfaces) {
    objectType.interfaces = type.interfaces.filter(interfaceType => {
      const interfaceTypeSettings = (0, _helpers.getTypeSettingsByType)(interfaceType);
      return !interfaceTypeSettings.exclude && (0, _helpers.fieldOfTypeWasFetched)(type);
    }).map(({
      name
    }) => (0, _helpers.buildTypeName)(name));
  }

  if (gatsbyNodeTypes.includes(type.name) || isAGatsbyNode || ( // this accounts for Node types that weren't fetched because
  // they have no root field to fetch a single node of this type
  // removing them from the schema breaks the build though
  // @todo instead, if a node type isn't fetched, remove it
  // from the entire schema
  type === null || type === void 0 ? void 0 : (_type$interfaces = type.interfaces) === null || _type$interfaces === void 0 ? void 0 : _type$interfaces.find(({
    name
  }) => name === `Node`))) {
    // this is used to filter the node interfaces
    // by different content types (post types)
    objectType.fields[`nodeType`] = `String`;
    objectType.interfaces = [`Node`, ...objectType.interfaces];
  } // @todo add this as a plugin option


  objectType = (0, _helpers.filterTypeDefinition)(objectType, typeBuilderApi, `OBJECT`);
  typeDefs.push(schema.buildObjectType(objectType));
};

const enumType = ({
  typeDefs,
  schema,
  type
}) => {
  typeDefs.push(schema.buildEnumType({
    name: (0, _helpers.buildTypeName)(type.name),
    values: type.enumValues.reduce((accumulator, {
      name
    }) => {
      accumulator[name] = {
        name
      };
      return accumulator;
    }, {}),
    description: type.description
  }));
};

var _default = {
  unionType,
  interfaceType,
  objectType,
  enumType
};
exports.default = _default;