"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.fieldTransformers = void 0;

var _helpers = require("../helpers");

var _transformUnion = require("./transform-union");

var _transformObject = require("./transform-object");

var _fetchNodes = require("../../source-nodes/fetch-nodes/fetch-nodes");

var _store = _interopRequireDefault(require("../../../store"));

var _isExcluded = require("../../ingest-remote-schema/is-excluded");

var _getGatsbyApi = require("../../../utils/get-gatsby-api");

const fieldTransformers = [{
  description: `NON_NULL Scalar`,
  test: field => field.type.kind === `NON_NULL` && field.type.ofType.kind === `SCALAR`,
  transform: ({
    field
  }) => {
    if ((0, _helpers.typeIsABuiltInScalar)(field.type)) {
      return `${field.type.ofType.name}!`;
    } else {
      return `JSON!`;
    }
  }
}, {
  description: `NON_NULL list type`,
  test: field => {
    var _field$type$ofType, _field$type$ofType$of;

    return field.type.kind === `NON_NULL` && field.type.ofType.kind === `LIST` && (field.type.ofType.name || ((_field$type$ofType = field.type.ofType) === null || _field$type$ofType === void 0 ? void 0 : (_field$type$ofType$of = _field$type$ofType.ofType) === null || _field$type$ofType$of === void 0 ? void 0 : _field$type$ofType$of.name));
  },
  transform: ({
    field
  }) => {
    const typeName = (0, _helpers.findTypeName)(field.type);
    const normalizedTypeName = (0, _helpers.typeIsABuiltInScalar)(field.type) ? typeName : (0, _helpers.buildTypeName)(typeName);
    return `[${normalizedTypeName}]!`;
  }
}, {
  description: `NON_NULL lists of NON_NULL types`,
  test: field => {
    var _field$type$ofType2, _field$type$ofType2$o;

    return field.type.kind === `NON_NULL` && field.type.ofType.kind === `LIST` && ((_field$type$ofType2 = field.type.ofType) === null || _field$type$ofType2 === void 0 ? void 0 : (_field$type$ofType2$o = _field$type$ofType2.ofType) === null || _field$type$ofType2$o === void 0 ? void 0 : _field$type$ofType2$o.kind) === `NON_NULL`;
  },
  transform: ({
    field,
    fieldName
  }) => {
    const originalTypeName = (0, _helpers.findTypeName)(field.type);
    const typeKind = (0, _helpers.findTypeKind)(field.type);
    const normalizedType = typeKind === `SCALAR` && (0, _helpers.typeIsABuiltInScalar)(field.type) ? originalTypeName : (0, _helpers.buildTypeName)(originalTypeName);
    return {
      type: `[${normalizedType}!]!`,
      resolve: source => {
        var _field$type;

        const resolvedField = source[fieldName];

        if (typeof resolvedField !== `undefined`) {
          return resolvedField !== null && resolvedField !== void 0 ? resolvedField : [];
        }

        const autoAliasedFieldPropertyName = `${fieldName}__typename_${field === null || field === void 0 ? void 0 : (_field$type = field.type) === null || _field$type === void 0 ? void 0 : _field$type.name}`;
        const aliasedField = source[autoAliasedFieldPropertyName];
        return aliasedField !== null && aliasedField !== void 0 ? aliasedField : [];
      }
    };
  }
}, {
  description: `Lists of NON_NULL builtin types`,
  test: field => {
    var _field$type$ofType$na, _field$type$ofType3, _field$type$ofType3$o;

    return field.type.kind === `LIST` && field.type.ofType.kind === `NON_NULL` && ((_field$type$ofType$na = field.type.ofType.name) !== null && _field$type$ofType$na !== void 0 ? _field$type$ofType$na : (_field$type$ofType3 = field.type.ofType) === null || _field$type$ofType3 === void 0 ? void 0 : (_field$type$ofType3$o = _field$type$ofType3.ofType) === null || _field$type$ofType3$o === void 0 ? void 0 : _field$type$ofType3$o.name) && (0, _helpers.typeIsABuiltInScalar)(field.type);
  },
  transform: ({
    field
  }) => `[${(0, _helpers.findTypeName)(field.type)}!]`
}, {
  description: `Lists of NON_NULL types`,
  test: field => {
    var _field$type$ofType$na2, _field$type$ofType4, _field$type$ofType4$o;

    return field.type.kind === `LIST` && field.type.ofType.kind === `NON_NULL` && ((_field$type$ofType$na2 = field.type.ofType.name) !== null && _field$type$ofType$na2 !== void 0 ? _field$type$ofType$na2 : (_field$type$ofType4 = field.type.ofType) === null || _field$type$ofType4 === void 0 ? void 0 : (_field$type$ofType4$o = _field$type$ofType4.ofType) === null || _field$type$ofType4$o === void 0 ? void 0 : _field$type$ofType4$o.name);
  },
  transform: ({
    field
  }) => `[${(0, _helpers.buildTypeName)((0, _helpers.findTypeName)(field.type))}!]`
}, {
  description: `ENUM type`,
  test: field => field.type.kind === `ENUM`,
  transform: ({
    field
  }) => (0, _helpers.buildTypeName)(field.type.name)
}, {
  description: `Scalar type`,
  test: field => field.type.kind === `SCALAR`,
  transform: ({
    field
  }) => {
    if ((0, _helpers.typeIsABuiltInScalar)(field.type)) {
      return field.type.name;
    } else {
      // custom scalars are typed as JSON
      // @todo if frequently requested,
      // make this hookable so a plugin could register a custom scalar
      return `JSON`;
    }
  }
}, {
  description: `Gatsby Node Objects or Gatsby Node Interfaces where all possible types are Gatsby Nodes`,
  test: field => {
    var _store$getState$remot, _store$getState$remot2;

    const gatsbyNodeTypes = (0, _fetchNodes.getGatsbyNodeTypeNames)();
    const pluginOptions = (0, _getGatsbyApi.getPluginOptions)();
    const isAnInterfaceTypeOfGatsbyNodes = // if this is an interface
    field.type.kind === `INTERFACE` && ( // and every possible type is a future gatsby node
    (_store$getState$remot = _store.default.getState() // get the full type for this interface
    .remoteSchema.typeMap.get((0, _helpers.findTypeName)(field.type)) // filter out any excluded types
    .possibleTypes) === null || _store$getState$remot === void 0 ? void 0 : (_store$getState$remot2 = _store$getState$remot.filter(possibleType => !(0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: possibleType.name
    })) // if every remaining type is a Gatsby node type
    // then use this field transformer
    ) === null || _store$getState$remot2 === void 0 ? void 0 : _store$getState$remot2.every(possibleType => gatsbyNodeTypes.includes(possibleType.name)));
    return gatsbyNodeTypes.includes(field.type.name) && field.type.kind === `OBJECT` || isAnInterfaceTypeOfGatsbyNodes;
  },
  transform: _transformObject.transformGatsbyNodeObject
}, {
  description: `Lists of Gatsby Node Object types`,
  test: field => {
    var _typeMap$get, _typeMap$get$possible;

    const gatsbyNodeTypes = (0, _fetchNodes.getGatsbyNodeTypeNames)();

    const {
      remoteSchema: {
        typeMap
      }
    } = _store.default.getState();

    return (// this is a list of Gatsby nodes
      field.type.kind === `LIST` && field.type.ofType.kind === `OBJECT` && gatsbyNodeTypes.includes(field.type.ofType.name) || // or it's a list of an interface type which Gatsby nodes implement
      field.type.kind === `LIST` && field.type.ofType.kind === `INTERFACE` && ((_typeMap$get = typeMap.get(field.type.ofType.name)) === null || _typeMap$get === void 0 ? void 0 : (_typeMap$get$possible = _typeMap$get.possibleTypes) === null || _typeMap$get$possible === void 0 ? void 0 : _typeMap$get$possible.find(possibleType => gatsbyNodeTypes.includes(possibleType.name)))
    );
  },
  transform: _transformObject.transformListOfGatsbyNodes
}, {
  description: `Non-Gatsby Node Objects`,
  test: field => field.type.kind === `OBJECT`,
  transform: ({
    field
  }) => (0, _helpers.buildTypeName)(field.type.name)
}, {
  description: `Lists of Non Gatsby Node Objects`,
  test: field => field.type.kind === `LIST` && (field.type.ofType.kind === `OBJECT` || field.type.ofType.kind === `ENUM`),
  transform: ({
    field
  }) => `[${(0, _helpers.buildTypeName)(field.type.ofType.name)}]`
}, {
  description: `Lists of Union types`,
  test: field => field.type.kind === `LIST` && field.type.ofType.kind === `UNION`,
  transform: _transformUnion.transformListOfUnions
}, {
  description: `Lists of Scalar types`,
  test: field => field.type.kind === `LIST` && field.type.ofType.kind === `SCALAR`,
  transform: ({
    field
  }) => {
    if ((0, _helpers.typeIsABuiltInScalar)(field.type)) {
      return `[${field.type.ofType.name}]`;
    } else {
      return `[JSON]`;
    }
  }
}, {
  description: `Lists of Interface types`,
  test: field => field.type.kind === `LIST` && field.type.ofType.kind === `INTERFACE`,
  transform: ({
    field
  }) => `[${(0, _helpers.buildTypeName)(field.type.ofType.name)}]`
}, {
  description: `Union type`,
  test: field => field.type.kind === `UNION`,
  transform: _transformUnion.transformUnion
}, {
  description: `Interface type`,
  test: field => field.type.kind === `INTERFACE`,
  transform: ({
    field
  }) => (0, _helpers.buildTypeName)(field.type.name)
}, {
  description: `Lists of NON_NULL types`,
  test: field => (0, _helpers.findTypeKind)(field.type) !== `LIST` && field.type.kind === `NON_NULL`,
  transform: ({
    field
  }) => `${(0, _helpers.buildTypeName)((0, _helpers.findTypeName)(field.type))}!`
} // for finding unhandled types
// {
//   description: `Unhandled type`,
//   test: () => true,
//   transform: ({ field }) => dd(field),
// },
];
exports.fieldTransformers = fieldTransformers;