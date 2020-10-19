"use strict";

exports.__esModule = true;
exports.buildDefaultResolver = void 0;

var _helpers = require("../helpers");

var _transformObject = require("./transform-object");

const buildDefaultResolver = transformerApi => (source, _, context) => {
  var _field$type, _finalFieldValue, _finalFieldValue2;

  const {
    fieldName,
    field,
    gatsbyNodeTypes
  } = transformerApi;
  let finalFieldValue;
  const resolvedField = source[fieldName];

  if (typeof resolvedField !== `undefined`) {
    finalFieldValue = resolvedField;
  }

  const autoAliasedFieldPropertyName = `${fieldName}__typename_${field === null || field === void 0 ? void 0 : (_field$type = field.type) === null || _field$type === void 0 ? void 0 : _field$type.name}`;
  const aliasedField = source[autoAliasedFieldPropertyName];

  if (typeof resolvedField === `undefined` && typeof aliasedField !== `undefined`) {
    finalFieldValue = aliasedField;
  } // the findTypeName helpers was written after this resolver
  // had been in production for a while.
  // so we don't know if in all cases it will find the right typename
  // for this resolver..
  // So the old way of doing it is above in autoAliasedFieldPropertyName
  // @todo write comprehesive data resolution integration tests
  // using many different WPGraphQL extensions
  // then come back and remove the `return aliasedField` line and
  // see if this still resolves everything properly


  const typeName = (0, _helpers.findTypeName)(field.type);
  const autoAliasedFieldName = `${fieldName}__typename_${typeName}`;
  const aliasedField2 = source[autoAliasedFieldName];

  if (typeof resolvedField === `undefined` && typeof aliasedField2 !== `undefined`) {
    finalFieldValue = aliasedField2;
  }

  const isANodeConnection = // if this field has just an id and typename
  ((_finalFieldValue = finalFieldValue) === null || _finalFieldValue === void 0 ? void 0 : _finalFieldValue.id) && ((_finalFieldValue2 = finalFieldValue) === null || _finalFieldValue2 === void 0 ? void 0 : _finalFieldValue2.__typename) && Object.keys(finalFieldValue).length === 2 && // and it's a Gatsby Node type
  gatsbyNodeTypes.includes(finalFieldValue.__typename);

  if (isANodeConnection) {
    const gatsbyNodeResolver = (0, _transformObject.buildGatsbyNodeObjectResolver)(transformerApi);
    return gatsbyNodeResolver(source, _, context);
  }

  return finalFieldValue;
};

exports.buildDefaultResolver = buildDefaultResolver;