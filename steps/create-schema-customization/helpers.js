"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.filterTypeDefinition = exports.getTypeSettingsByType = exports.typeIsASupportedScalar = exports.typeIsABuiltInScalar = exports.fieldOfTypeWasFetched = exports.findTypeKind = exports.findTypeName = exports.buildTypeName = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _typeFilters = require("./type-filters");

var _getGatsbyApi = require("../../utils/get-gatsby-api");

/**
 * This function namespaces typenames with a prefix
 */
const buildTypeName = name => {
  if (!name || typeof name !== `string`) {
    return null;
  }

  const {
    schema: {
      typePrefix: prefix
    }
  } = (0, _getGatsbyApi.getPluginOptions)(); // this is for our namespace type on the root { wp { ...fields } }

  if (name === prefix) {
    return name;
  }

  return prefix + name;
};
/**
 * Find the first type name of a Type definition pulled via introspection
 * @param {object} type
 */


exports.buildTypeName = buildTypeName;

const findTypeName = type => {
  var _type$ofType, _type$ofType2, _type$ofType2$ofType, _type$ofType3, _type$ofType3$ofType, _type$ofType3$ofType$;

  return (type === null || type === void 0 ? void 0 : type.name) || (type === null || type === void 0 ? void 0 : (_type$ofType = type.ofType) === null || _type$ofType === void 0 ? void 0 : _type$ofType.name) || (type === null || type === void 0 ? void 0 : (_type$ofType2 = type.ofType) === null || _type$ofType2 === void 0 ? void 0 : (_type$ofType2$ofType = _type$ofType2.ofType) === null || _type$ofType2$ofType === void 0 ? void 0 : _type$ofType2$ofType.name) || (type === null || type === void 0 ? void 0 : (_type$ofType3 = type.ofType) === null || _type$ofType3 === void 0 ? void 0 : (_type$ofType3$ofType = _type$ofType3.ofType) === null || _type$ofType3$ofType === void 0 ? void 0 : (_type$ofType3$ofType$ = _type$ofType3$ofType.ofType) === null || _type$ofType3$ofType$ === void 0 ? void 0 : _type$ofType3$ofType$.name);
};
/**
 * Find the first type kind of a Type definition pulled via introspection
 * @param {object} type
 */


exports.findTypeName = findTypeName;

const findTypeKind = type => {
  var _type$ofType4, _type$ofType5, _type$ofType5$ofType, _type$ofType6, _type$ofType6$ofType, _type$ofType6$ofType$;

  return (type === null || type === void 0 ? void 0 : type.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType4 = type.ofType) === null || _type$ofType4 === void 0 ? void 0 : _type$ofType4.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType5 = type.ofType) === null || _type$ofType5 === void 0 ? void 0 : (_type$ofType5$ofType = _type$ofType5.ofType) === null || _type$ofType5$ofType === void 0 ? void 0 : _type$ofType5$ofType.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType6 = type.ofType) === null || _type$ofType6 === void 0 ? void 0 : (_type$ofType6$ofType = _type$ofType6.ofType) === null || _type$ofType6$ofType === void 0 ? void 0 : (_type$ofType6$ofType$ = _type$ofType6$ofType.ofType) === null || _type$ofType6$ofType$ === void 0 ? void 0 : _type$ofType6$ofType$.kind);
};

exports.findTypeKind = findTypeKind;

const fieldOfTypeWasFetched = type => {
  const {
    fetchedTypes
  } = _store.default.getState().remoteSchema;

  const typeName = findTypeName(type);
  const typeWasFetched = !!fetchedTypes.get(typeName);
  return typeWasFetched;
};

exports.fieldOfTypeWasFetched = fieldOfTypeWasFetched;
const supportedScalars = [`Int`, `Float`, `String`, `Boolean`, `ID`, `Date`, `JSON`];

const typeIsABuiltInScalar = type => // @todo the next function and this one are redundant.
// see the next todo on how to fix the issue. If that todo is resolved, these functions will be identical. :(
supportedScalars.includes(findTypeName(type));

exports.typeIsABuiltInScalar = typeIsABuiltInScalar;

const typeIsASupportedScalar = type => {
  if (findTypeKind(type) !== `SCALAR`) {
    // @todo returning true here seems wrong since a type that is not a scalar can't be a supported scalar... so there is some other logic elsewhere that is wrong
    // making this return false causes errors in the schema
    return true;
  }

  return supportedScalars.includes(findTypeName(type));
}; // retrieves plugin settings for the provided type


exports.typeIsASupportedScalar = typeIsASupportedScalar;

const getTypeSettingsByType = type => {
  if (!type) {
    return {};
  } // the plugin options object containing every type setting


  const allTypeSettings = _store.default.getState().gatsbyApi.pluginOptions.type; // the type.__all plugin option which is applied to every type setting


  const __allTypeSetting = allTypeSettings.__all || {};

  const typeName = findTypeName(type);
  const typeSettings = allTypeSettings[typeName];

  if (typeSettings) {
    return Object.assign({}, __allTypeSetting, typeSettings);
  }

  return __allTypeSetting;
};
/**
 * This is used to filter the automatically generated type definitions before they're added to the schema customization api.
 */


exports.getTypeSettingsByType = getTypeSettingsByType;

const filterTypeDefinition = (typeDefinition, typeBuilderApi, typeKind) => {
  const filters = _typeFilters.typeDefinitionFilters.filter(filter => [typeBuilderApi.type.name, `__all`].includes(filter.typeName));

  if (filters === null || filters === void 0 ? void 0 : filters.length) {
    filters.forEach(filter => {
      if (filter && typeof filter.typeDef === `function`) {
        typeDefinition = filter.typeDef(typeDefinition, typeBuilderApi, typeKind);
      }
    });
  }

  return typeDefinition;
};

exports.filterTypeDefinition = filterTypeDefinition;