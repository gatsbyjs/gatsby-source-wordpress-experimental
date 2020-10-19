"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getQueryInfoByTypeName = exports.getQueryInfoBySingleFieldName = exports.getTypeInfoBySingleName = void 0;

var _store = _interopRequireDefault(require("../../store"));

const getTypeInfoBySingleName = singleName => {
  const {
    typeMap
  } = _store.default.getState().remoteSchema;

  const rootField = typeMap.get(`RootQuery`).fields.find(field => field.name === singleName);
  const typeName = rootField.type.name || rootField.type.ofType.name;
  const type = typeMap.get(typeName);
  return type;
};

exports.getTypeInfoBySingleName = getTypeInfoBySingleName;

const getQueryInfoBySingleFieldName = singleName => {
  const {
    nodeQueries
  } = _store.default.getState().remoteSchema;

  const queryInfo = Object.values(nodeQueries).find(q => q.typeInfo.singularName === singleName);
  return queryInfo;
};

exports.getQueryInfoBySingleFieldName = getQueryInfoBySingleFieldName;

const getQueryInfoByTypeName = typeName => {
  const {
    nodeQueries
  } = _store.default.getState().remoteSchema;

  const queryInfo = Object.values(nodeQueries).find(q => q.typeInfo.nodesTypeName === typeName);
  return queryInfo;
};

exports.getQueryInfoByTypeName = getQueryInfoByTypeName;