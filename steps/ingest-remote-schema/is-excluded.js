"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.fieldIsExcludedOnParentType = exports.typeIsExcluded = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _helpers = require("../create-schema-customization/helpers");

const typeIsExcluded = ({
  pluginOptions,
  typeName
}) => pluginOptions && pluginOptions.type[typeName] && pluginOptions.type[typeName].exclude;

exports.typeIsExcluded = typeIsExcluded;

const fieldIsExcludedOnParentType = ({
  pluginOptions,
  field,
  parentType
}) => {
  var _fullType$fields, _allTypeSettings$pare, _allTypeSettings$pare2, _allTypeSettings$pare3, _allTypeSettings$pare4;

  const allTypeSettings = pluginOptions.type;

  const state = _store.default.getState();

  const {
    typeMap
  } = state.remoteSchema;
  const fullType = typeMap.get((0, _helpers.findTypeName)(parentType));
  const parentTypeNodesField = fullType === null || fullType === void 0 ? void 0 : (_fullType$fields = fullType.fields) === null || _fullType$fields === void 0 ? void 0 : _fullType$fields.find(field => field.name === `nodes`);
  const parentTypeNodesFieldTypeName = (0, _helpers.findTypeName)(parentTypeNodesField === null || parentTypeNodesField === void 0 ? void 0 : parentTypeNodesField.type);
  const fieldIsExcludedOnParentType = // if this field is excluded on either the parent type
  ((_allTypeSettings$pare = allTypeSettings[parentType === null || parentType === void 0 ? void 0 : parentType.name]) === null || _allTypeSettings$pare === void 0 ? void 0 : (_allTypeSettings$pare2 = _allTypeSettings$pare.excludeFieldNames) === null || _allTypeSettings$pare2 === void 0 ? void 0 : _allTypeSettings$pare2.includes(field === null || field === void 0 ? void 0 : field.name)) || ( // or the parent type has a "nodes" field and that type has this field excluded
  (_allTypeSettings$pare3 = allTypeSettings[parentTypeNodesFieldTypeName]) === null || _allTypeSettings$pare3 === void 0 ? void 0 : (_allTypeSettings$pare4 = _allTypeSettings$pare3.excludeFieldNames) === null || _allTypeSettings$pare4 === void 0 ? void 0 : _allTypeSettings$pare4.includes(field === null || field === void 0 ? void 0 : field.name));
  return !!fieldIsExcludedOnParentType;
};

exports.fieldIsExcludedOnParentType = fieldIsExcludedOnParentType;