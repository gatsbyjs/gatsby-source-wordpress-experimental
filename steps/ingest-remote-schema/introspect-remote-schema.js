"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.introspectAndStoreRemoteSchema = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _cache = require("../../utils/cache");

var _fetchGraphql = _interopRequireDefault(require("../../utils/fetch-graphql"));

var _graphqlQueries = require("../../utils/graphql-queries");

const introspectAndStoreRemoteSchema = async () => {
  const state = _store.default.getState();

  const {
    pluginOptions
  } = state.gatsbyApi;
  const {
    schemaWasChanged
  } = state.remoteSchema;
  const INTROSPECTION_CACHE_KEY = `${pluginOptions.url}--introspection-data`;
  let introspectionData = await (0, _cache.getPersistentCache)({
    key: INTROSPECTION_CACHE_KEY
  });

  if (!introspectionData || schemaWasChanged) {
    const {
      data
    } = await (0, _fetchGraphql.default)({
      query: _graphqlQueries.introspectionQuery
    });
    introspectionData = data; // cache introspection response

    await (0, _cache.setPersistentCache)({
      key: INTROSPECTION_CACHE_KEY,
      value: introspectionData
    });
  }

  const typeMap = new Map(introspectionData.__schema.types.map(type => [type.name, type]));

  _store.default.dispatch.remoteSchema.setState({
    introspectionData,
    typeMap
  });
};

exports.introspectAndStoreRemoteSchema = introspectAndStoreRemoteSchema;