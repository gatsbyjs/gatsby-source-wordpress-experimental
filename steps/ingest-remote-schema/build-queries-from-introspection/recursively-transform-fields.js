"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.transformField = transformField;
exports.default = exports.transformInlineFragments = void 0;

var _store = _interopRequireDefault(require("../../../store"));

var _helpers = require("../../create-schema-customization/helpers");

var _isExcluded = require("../is-excluded");

var _transformFields = require("../../create-schema-customization/transform-fields");

const transformInlineFragments = ({
  possibleTypes,
  gatsbyNodesInfo,
  typeMap,
  maxDepth,
  parentType,
  mainType,
  parentField,
  fragments,
  circularQueryLimit,
  buildGatsbyNodeFields = false,
  debug = false,
  depth = 0,
  buildingFragment = false,
  ancestorTypeNames: parentAncestorTypeNames = []
}) => {
  const state = _store.default.getState();

  if (!typeMap) {
    typeMap = state.remoteSchema.typeMap;
  }

  const {
    pluginOptions
  } = state.gatsbyApi;

  if (!maxDepth) {
    maxDepth = pluginOptions.schema.queryDepth;
  }

  if (!circularQueryLimit) {
    circularQueryLimit = pluginOptions.circularQueryLimit;
  }

  if (!gatsbyNodesInfo) {
    gatsbyNodesInfo = state.remoteSchema.gatsbyNodesInfo;
  }

  const ancestorTypeNames = [...parentAncestorTypeNames];
  const transformedInlineFragments = possibleTypes.map(possibleType => {
    possibleType = Object.assign({}, possibleType);
    const type = typeMap.get(possibleType.name);

    if (!type) {
      return false;
    }

    const typeSettings = (0, _helpers.getTypeSettingsByType)(type);

    if (typeSettings.exclude) {
      return false;
    }

    possibleType.type = Object.assign({}, type); // save this type so we can use it in schema customization

    _store.default.dispatch.remoteSchema.addFetchedType(type);

    const isAGatsbyNode = gatsbyNodesInfo.typeNames.includes(possibleType.name);

    if (isAGatsbyNode && !buildGatsbyNodeFields) {
      // we use the id to link to the top level Gatsby node
      possibleType.fields = [`id`];
      return possibleType;
    }

    const typeInfo = typeMap.get(possibleType.name);
    let filteredFields = [...typeInfo.fields];

    if ((parentType === null || parentType === void 0 ? void 0 : parentType.kind) === `INTERFACE`) {
      // remove any fields from our fragment if the parent type already has them as shared fields
      filteredFields = filteredFields.filter(filteredField => !parentType.fields.find(parentField => parentField.name === filteredField.name));
    }

    if (typeInfo) {
      const fields = recursivelyTransformFields({
        fields: filteredFields,
        parentType: type,
        depth,
        ancestorTypeNames,
        fragments,
        buildingFragment,
        circularQueryLimit,
        mainType,
        parentField
      });

      if (!fields || !fields.length) {
        return false;
      }

      possibleType.fields = [...fields];
      return possibleType;
    }

    return false;
  }).filter(Boolean);
  return possibleTypes && depth <= maxDepth ? transformedInlineFragments : null;
}; // since we're counting circular types that may be on fields many levels up, incarnation felt like it works here ;) the types are born again in later generations


exports.transformInlineFragments = transformInlineFragments;

const countIncarnations = ({
  typeName,
  ancestorTypeNames
}) => {
  var _ancestorTypeNames$fi;

  return ancestorTypeNames.length ? (_ancestorTypeNames$fi = ancestorTypeNames.filter(ancestorTypeName => ancestorTypeName === typeName)) === null || _ancestorTypeNames$fi === void 0 ? void 0 : _ancestorTypeNames$fi.length : 0;
};

function transformField({
  field,
  gatsbyNodesInfo,
  typeMap,
  maxDepth,
  depth,
  fieldBlacklist,
  fieldAliases,
  ancestorTypeNames: parentAncestorTypeNames,
  circularQueryLimit,
  fragments,
  buildingFragment,
  mainType,
  parentField
} = {}) {
  var _field$type, _field$type$ofType, _fieldType$fields, _typeMap$get, _typeMap$get$possible;

  const ancestorTypeNames = [...parentAncestorTypeNames]; // we're potentially infinitely recursing when fields are connected to other types that have fields that are connections to other types
  //  so we need a maximum limit for that

  if (depth > maxDepth) {
    return false;
  }

  depth++; // if the field has no type we can't use it.

  if (!field || !field.type) {
    return false;
  }

  const typeSettings = (0, _helpers.getTypeSettingsByType)(field.type);

  if (typeSettings.exclude) {
    return false;
  } // count the number of times this type has appeared as an ancestor of itself
  // somewhere up the tree


  const typeName = (0, _helpers.findTypeName)(field.type);
  const typeKind = (0, _helpers.findTypeKind)(field.type);
  const typeIncarnationCount = countIncarnations({
    typeName,
    ancestorTypeNames
  });

  if (typeIncarnationCount > 0) {
    // this type is nested within itself atleast once
    // create a fragment here that can be reused
    createFragment({
      fields: typeMap.get(typeName).fields,
      type: field.type,
      fragments,
      field,
      ancestorTypeNames: parentAncestorTypeNames,
      depth,
      fieldBlacklist,
      fieldAliases,
      typeMap,
      gatsbyNodesInfo,
      circularQueryLimit,
      queryDepth: maxDepth,
      buildingFragment,
      mainType
    });
  }

  if (typeIncarnationCount >= circularQueryLimit) {
    return false;
  } // this is used to alias fields that conflict with Gatsby node fields
  // for ex Gatsby and WPGQL both have a `parent` field


  const fieldName = (0, _transformFields.returnAliasedFieldName)({
    fieldAliases,
    field
  });

  if (fieldBlacklist.includes(field.name) || fieldBlacklist.includes(fieldName)) {
    return false;
  } // remove fields that have required args. They'll cause query errors if ommitted
  //  and we can't determine how to use those args programatically.


  if (field.args && field.args.length && field.args.find(arg => {
    var _arg$type;

    return (arg === null || arg === void 0 ? void 0 : (_arg$type = arg.type) === null || _arg$type === void 0 ? void 0 : _arg$type.kind) === `NON_NULL`;
  })) {
    return false;
  }

  const fieldType = typeMap.get((0, _helpers.findTypeName)(field.type)) || {};
  const ofType = typeMap.get((0, _helpers.findTypeName)(fieldType.ofType)) || {};

  if (fieldType.kind === `SCALAR` || fieldType.kind === `ENUM` || fieldType.kind === `NON_NULL` && ofType.kind === `SCALAR` || fieldType.kind === `LIST` && fieldType.ofType.kind === `SCALAR` || // a list of enums has no type name, so findTypeName above finds the enum type
  // instead of the field type. Need to explicitly check here
  // instead of using helpers
  field.type.kind === `LIST` && ((_field$type = field.type) === null || _field$type === void 0 ? void 0 : (_field$type$ofType = _field$type.ofType) === null || _field$type$ofType === void 0 ? void 0 : _field$type$ofType.kind) === `ENUM`) {
    return {
      fieldName,
      fieldType
    };
  }

  const isListOfGatsbyNodes = ofType && gatsbyNodesInfo.typeNames.includes(typeName);
  const isListOfMediaItems = ofType && typeName === `MediaItem`;
  const hasIdField = fieldType === null || fieldType === void 0 ? void 0 : (_fieldType$fields = fieldType.fields) === null || _fieldType$fields === void 0 ? void 0 : _fieldType$fields.find(({
    name
  }) => name === `id`);

  if (fieldType.kind === `LIST` && isListOfGatsbyNodes && !isListOfMediaItems && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`id`],
      fieldType
    };
  } else if (fieldType.kind === `LIST` && isListOfMediaItems && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`__typename`, `id`],
      fieldType
    };
  } else if (fieldType.kind === `LIST`) {
    const listOfType = typeMap.get((0, _helpers.findTypeName)(fieldType));
    const transformedFields = recursivelyTransformFields({
      fields: listOfType.fields,
      parentType: listOfType || fieldType,
      depth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment,
      mainType
    });
    const transformedInlineFragments = transformInlineFragments({
      possibleTypes: listOfType.possibleTypes,
      parentType: listOfType || fieldType,
      parentField: field,
      mainType,
      gatsbyNodesInfo,
      typeMap,
      depth,
      maxDepth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });

    if (!(transformedFields === null || transformedFields === void 0 ? void 0 : transformedFields.length) && !(transformedInlineFragments === null || transformedInlineFragments === void 0 ? void 0 : transformedInlineFragments.length)) {
      return false;
    } // if we have either inlineFragments or fields


    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments: transformedInlineFragments,
      fieldType
    };
  }

  const isAGatsbyNode = // if this is a gatsby node type
  gatsbyNodesInfo.typeNames.includes(typeName) || ( // or this type has a possible type which is a gatsby node type
  (_typeMap$get = typeMap.get(typeName)) === null || _typeMap$get === void 0 ? void 0 : (_typeMap$get$possible = _typeMap$get.possibleTypes) === null || _typeMap$get$possible === void 0 ? void 0 : _typeMap$get$possible.find(possibleType => gatsbyNodesInfo.typeNames.includes(possibleType.name)));
  const isAMediaItemNode = isAGatsbyNode && typeName === `MediaItem`; // pull the id and __typename for connections to media item gatsby nodes

  if (isAMediaItemNode && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`__typename`, `id`],
      fieldType
    };
  } else if (isAGatsbyNode && hasIdField) {
    const isAnInterfaceType = // if this is an interface
    typeKind === `INTERFACE` || fieldType.kind === `INTERFACE`;
    return {
      fieldName: fieldName,
      fields: isAnInterfaceType ? // we need the typename for interfaces
      [`id`, `__typename`] : // or just the id for 1:1 connections to gatsby nodes
      [`id`],
      fieldType
    };
  }

  const typeInfo = typeMap.get((0, _helpers.findTypeName)(fieldType));
  const {
    fields
  } = typeInfo || {};
  let transformedInlineFragments;

  if (typeInfo.possibleTypes) {
    transformedInlineFragments = transformInlineFragments({
      possibleTypes: typeInfo.possibleTypes,
      parentType: typeInfo,
      parentField: field,
      mainType,
      gatsbyNodesInfo,
      typeMap,
      depth,
      maxDepth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
  }

  if (fields || transformedInlineFragments) {
    var _transformedInlineFra;

    const transformedFields = recursivelyTransformFields({
      parentType: typeInfo,
      parentFieldName: field.name,
      mainType,
      fields,
      depth,
      ancestorTypeNames,
      parentField: field,
      fragments,
      circularQueryLimit,
      buildingFragment
    });

    if (!(transformedFields === null || transformedFields === void 0 ? void 0 : transformedFields.length) && !((_transformedInlineFra = transformedInlineFragments) === null || _transformedInlineFra === void 0 ? void 0 : _transformedInlineFra.length)) {
      return false;
    }

    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments: transformedInlineFragments,
      fieldType
    };
  }

  if (fieldType.kind === `UNION`) {
    const typeInfo = typeMap.get(fieldType.name);
    const transformedFields = recursivelyTransformFields({
      fields: typeInfo.fields,
      parentType: fieldType,
      mainType,
      depth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
    const inlineFragments = transformInlineFragments({
      possibleTypes: typeInfo.possibleTypes,
      gatsbyNodesInfo,
      typeMap,
      mainType,
      depth,
      maxDepth,
      ancestorTypeNames,
      parentField: field,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments,
      fieldType
    };
  }

  return false;
}

const createFragment = ({
  fields,
  field,
  type,
  fragments,
  fieldBlacklist,
  fieldAliases,
  typeMap,
  gatsbyNodesInfo,
  queryDepth,
  ancestorTypeNames,
  mainType,
  buildingFragment = false
}) => {
  var _queryType$possibleTy;

  const typeName = (0, _helpers.findTypeName)(type);

  if (buildingFragment) {
    // this fragment is inside a fragment that's already being built so we should exit
    return null;
  }

  const previouslyCreatedFragment = fragments === null || fragments === void 0 ? void 0 : fragments[typeName];

  if (previouslyCreatedFragment && buildingFragment === typeName) {
    return previouslyCreatedFragment;
  }

  const fragmentFields = fields.reduce((fragmentFields, field) => {
    var _fieldType$fields2;

    const fieldTypeName = (0, _helpers.findTypeName)(field.type);
    const fieldType = typeMap.get(fieldTypeName);

    if ( // if this field is a different type than the fragment but has a field of the same type as the fragment,
    // we need to skip this field in the fragment to prevent nesting this type in itself a level down
    fieldType.name !== typeName && (fieldType === null || fieldType === void 0 ? void 0 : (_fieldType$fields2 = fieldType.fields) === null || _fieldType$fields2 === void 0 ? void 0 : _fieldType$fields2.find(innerFieldField => (0, _helpers.findTypeName)(innerFieldField.type) === typeName))) {
      return fragmentFields;
    }

    const transformedField = transformField({
      field,
      gatsbyNodesInfo,
      typeMap,
      maxDepth: queryDepth,
      depth: 0,
      fieldBlacklist,
      fieldAliases,
      ancestorTypeNames,
      mainType,
      circularQueryLimit: 1,
      fragments,
      buildingFragment: typeName
    });

    if ((0, _helpers.findTypeName)(field.type) !== typeName && !!transformedField) {
      fragmentFields.push(transformedField);
    }

    return fragmentFields;
  }, []);
  const queryType = typeMap.get(typeName);
  const transformedInlineFragments = (queryType === null || queryType === void 0 ? void 0 : (_queryType$possibleTy = queryType.possibleTypes) === null || _queryType$possibleTy === void 0 ? void 0 : _queryType$possibleTy.length) ? transformInlineFragments({
    possibleTypes: queryType.possibleTypes,
    parentType: queryType,
    parentField: field,
    mainType,
    gatsbyNodesInfo,
    typeMap,
    depth: 0,
    maxDepth: queryDepth,
    circularQueryLimit: 1,
    ancestorTypeNames,
    fragments,
    buildingFragment: typeName
  }) : null;

  if (fragments) {
    fragments[typeName] = {
      name: `${typeName}Fragment`,
      type: typeName,
      fields: fragmentFields,
      inlineFragments: transformedInlineFragments
    };
  }

  return fragmentFields;
};

const transformFields = ({
  fields,
  parentType,
  mainType,
  fragments,
  parentField,
  ancestorTypeNames,
  depth,
  fieldBlacklist,
  fieldAliases,
  typeMap,
  gatsbyNodesInfo,
  queryDepth,
  circularQueryLimit,
  pluginOptions,
  buildingFragment
}) => fields === null || fields === void 0 ? void 0 : fields.filter(field => !(0, _isExcluded.fieldIsExcludedOnParentType)({
  pluginOptions,
  field,
  parentType,
  mainType,
  parentField
})).map(field => {
  const transformedField = transformField({
    maxDepth: queryDepth,
    gatsbyNodesInfo,
    fieldBlacklist,
    fieldAliases,
    typeMap,
    field,
    depth,
    ancestorTypeNames,
    circularQueryLimit,
    fragments,
    buildingFragment,
    mainType,
    parentField
  });

  if (transformedField) {
    // save this type so we know to use it in schema customization
    _store.default.dispatch.remoteSchema.addFetchedType(field.type);
  }

  const typeName = (0, _helpers.findTypeName)(field.type);
  const fragment = fragments === null || fragments === void 0 ? void 0 : fragments[typeName]; // @todo add any adjacent fields and inline fragments directly to the stored fragment object so this logic can be changed to if (fragment) useTheFragment()
  // once that's done it can be added above and below transformField() above ☝️
  // and potentially short circuit expensive work that will be thrown away anyway

  if (fragment && transformedField && buildingFragment !== typeName) {
    var _transformedField$fie, _transformedField$inl;

    // if (fragment && buildingFragment !== typeName && transformedField) {
    // remove fields from this query that already exist in the fragment
    if (transformedField === null || transformedField === void 0 ? void 0 : (_transformedField$fie = transformedField.fields) === null || _transformedField$fie === void 0 ? void 0 : _transformedField$fie.length) {
      transformedField.fields = transformedField.fields.filter(field => !fragment.fields.find(fragmentField => fragmentField.fieldName === field.fieldName));
    } // if this field has no fields (because it has inline fragments only)
    // we need to create an empty array since we treat reusable fragments as
    // a field


    if (!transformedField.fields) {
      transformedField.fields = [];
    }

    transformedField.fields.push({
      internalType: `Fragment`,
      fragment
    });

    if (transformedField === null || transformedField === void 0 ? void 0 : (_transformedField$inl = transformedField.inlineFragments) === null || _transformedField$inl === void 0 ? void 0 : _transformedField$inl.length) {
      transformedField.inlineFragments = transformedField.inlineFragments.filter(fieldInlineFragment => // yes this is a horrible use of .find(). @todo refactor this for better perf
      !fragment.inlineFragments.find(fragmentInlineFragment => fragmentInlineFragment.name === fieldInlineFragment.name));
    }
  }

  if (field.fields && !transformedField) {
    return null;
  }

  const fieldTypeKind = (0, _helpers.findTypeKind)(field.type);
  const fieldOfTypeKind = (0, _helpers.findTypeKind)(field.type.ofType);
  const typeKindsRequiringSelectionSets = [`OBJECT`, `UNION`, `INTERFACE`];
  const fieldNeedsSelectionSet = typeKindsRequiringSelectionSets.includes(fieldTypeKind) || typeKindsRequiringSelectionSets.includes(fieldOfTypeKind);

  if ( // if our field needs a selectionset
  fieldNeedsSelectionSet && // but we have no fields
  !transformedField.fields && // and no inline fragments
  !transformedField.inlineFragments) {
    // we need to discard this field to prevent GraphQL errors
    // we're likely at the very bottom of the query depth
    // so that this fields children were omitted
    return null;
  }

  return transformedField;
}).filter(Boolean);

const recursivelyTransformFields = ({
  fields,
  parentType,
  mainType,
  fragments,
  parentField,
  ancestorTypeNames: parentAncestorTypeNames,
  depth = 0,
  buildingFragment = false
}) => {
  if (!fields || !fields.length) {
    return null;
  }

  if (!parentAncestorTypeNames) {
    parentAncestorTypeNames = [];
  }

  const ancestorTypeNames = [...parentAncestorTypeNames];

  const {
    gatsbyApi: {
      pluginOptions
    },
    remoteSchema: {
      fieldBlacklist,
      fieldAliases,
      typeMap,
      gatsbyNodesInfo
    }
  } = _store.default.getState();

  const {
    schema: {
      queryDepth,
      circularQueryLimit
    }
  } = pluginOptions;

  if (depth > queryDepth && ancestorTypeNames.length) {
    return null;
  }

  const typeName = (0, _helpers.findTypeName)(parentType);
  const grandParentTypeName = ancestorTypeNames.length ? ancestorTypeNames[ancestorTypeNames.length - 1] : null;

  if (grandParentTypeName && typeName !== grandParentTypeName) {
    // if a field has fields of the same type as the field above it
    // we shouldn't fetch them. 2 types that are circular between each other
    // are dangerous as they will generate very large queries and fetch data we don't need
    // these types should instead be proper connections so we can identify
    // that only an id needs to be fetched.
    // @todo maybe move this into transformFields() instead of here
    fields = fields.filter(field => {
      const fieldTypeName = (0, _helpers.findTypeName)(field.type);
      return fieldTypeName !== grandParentTypeName;
    });
  }

  const typeIncarnationCount = countIncarnations({
    typeName,
    ancestorTypeNames
  });

  if (typeIncarnationCount >= circularQueryLimit) {
    return null;
  }

  parentAncestorTypeNames.push(typeName);
  let recursivelyTransformedFields = transformFields({
    fields,
    parentType,
    mainType,
    fragments,
    parentField,
    ancestorTypeNames: parentAncestorTypeNames,
    depth,
    fieldBlacklist,
    fieldAliases,
    typeMap,
    gatsbyNodesInfo,
    queryDepth,
    circularQueryLimit,
    pluginOptions,
    buildingFragment
  });

  if (!recursivelyTransformedFields.length) {
    return null;
  }

  return recursivelyTransformedFields;
};

var _default = recursivelyTransformFields;
exports.default = _default;