"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.buildNonNodeQueries = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _recursivelyTransformFields = _interopRequireDefault(require("./build-queries-from-introspection/recursively-transform-fields"));

var _buildQueryOnFieldName = require("./build-queries-from-introspection/build-query-on-field-name");

const buildNonNodeQueries = async () => {
  const {
    remoteSchema: {
      ingestibles: {
        nonNodeRootFields
      }
    }
  } = _store.default.getState();

  const fragments = {}; // recursively transform fields

  const transformedFields = (0, _recursivelyTransformFields.default)({
    fields: nonNodeRootFields,
    parentType: {
      name: `RootQuery`,
      type: `OBJECT`
    },
    fragments
  });
  const selectionSet = (0, _buildQueryOnFieldName.buildSelectionSet)(transformedFields);
  const builtFragments = (0, _buildQueryOnFieldName.generateReusableFragments)({
    fragments,
    selectionSet
  });
  const nonNodeQuery = `
      query NON_NODE_QUERY {
        ${selectionSet}
      }
      ${builtFragments}
  `;

  _store.default.dispatch.remoteSchema.setState({
    nonNodeQuery
  });
};

exports.buildNonNodeQueries = buildNonNodeQueries;