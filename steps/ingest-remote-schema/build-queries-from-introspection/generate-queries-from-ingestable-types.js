"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _clipboardy2 = _interopRequireDefault(require("clipboardy"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _recursivelyTransformFields = _interopRequireWildcard(require("./recursively-transform-fields"));

var _buildQueryOnFieldName = require("./build-query-on-field-name");

var _store = _interopRequireDefault(require("../../../store"));

var _helpers = require("../../create-schema-customization/helpers");

var _prettier = _interopRequireDefault(require("prettier"));

var _formatLogMessage = require("../../../utils/format-log-message");

const recursivelyAliasFragments = field => field.inlineFragments.map(fragment => {
  // for each of this inlineFragments fields
  fragment.fields = fragment.fields.map(fragmentField => {
    if (typeof fragmentField === `string`) {
      return fragmentField;
    } // compare it against each field of each other fragment


    let updatedFragmentField = fragmentField;
    field.inlineFragments.forEach(possiblyConflictingFragment => {
      // don't compare this fragment against itself
      if (possiblyConflictingFragment.name === fragment.name) {
        return;
      }

      possiblyConflictingFragment.fields.forEach(possiblyConflictingField => {
        var _possiblyConflictingF, _fragmentField$fieldT, _possiblyConflictingF2, _fragmentField$fieldT2;

        const fieldNamesMatch = fragmentField.fieldName === possiblyConflictingField.fieldName;
        const fieldTypeKindsDontMatch = (possiblyConflictingField === null || possiblyConflictingField === void 0 ? void 0 : (_possiblyConflictingF = possiblyConflictingField.fieldType) === null || _possiblyConflictingF === void 0 ? void 0 : _possiblyConflictingF.kind) !== (fragmentField === null || fragmentField === void 0 ? void 0 : (_fragmentField$fieldT = fragmentField.fieldType) === null || _fragmentField$fieldT === void 0 ? void 0 : _fragmentField$fieldT.kind);
        const fieldTypeNamesDontMatch = (possiblyConflictingField === null || possiblyConflictingField === void 0 ? void 0 : (_possiblyConflictingF2 = possiblyConflictingField.fieldType) === null || _possiblyConflictingF2 === void 0 ? void 0 : _possiblyConflictingF2.name) !== (fragmentField === null || fragmentField === void 0 ? void 0 : (_fragmentField$fieldT2 = fragmentField.fieldType) === null || _fragmentField$fieldT2 === void 0 ? void 0 : _fragmentField$fieldT2.name); // if the fields have the same name but a different type kind
        // alias them

        if (fieldNamesMatch && (fieldTypeKindsDontMatch || fieldTypeNamesDontMatch)) {
          const autoAliasedFieldName = `${fragmentField.fieldName}__typename_${fragmentField.fieldType.name}: ${fragmentField.fieldName}`;
          updatedFragmentField = Object.assign({}, fragmentField, {
            fieldName: autoAliasedFieldName
          });
          return;
        }
      });
    }); // if the fields have the same name but a different type AND the field has sub fields, compare those sub fields against any fragment fields subfields where the field name matches
    // if any subfields have conflicting types, alias them

    if (updatedFragmentField.inlineFragments) {
      updatedFragmentField.inlineFragments = recursivelyAliasFragments(updatedFragmentField);
    }

    return updatedFragmentField;
  });
  return fragment;
});

const aliasConflictingFieldFields = field => {
  // we only have conflicting fields in inlineFragments
  // if there are no inlineFragments, do nothing
  if (!field.inlineFragments) {
    return field;
  }

  field.inlineFragments = recursivelyAliasFragments(field);

  if (field.fields) {
    field.fields = aliasConflictingFields({
      transformedFields: field.fields
    });
  }

  return field;
};

const aliasConflictingFields = ({
  transformedFields
}) => transformedFields.map(aliasConflictingFieldFields);

const aliasConflictingFragmentFields = ({
  fragments
}) => {
  for (const [fragmentKey, fragment] of Object.entries(fragments)) {
    const aliasedFragment = aliasConflictingFieldFields(fragment);
    fragments[fragmentKey] = aliasedFragment;
  }
};
/**
 * generateNodeQueriesFromIngestibleFields
 *
 * Takes in data from an introspection query and
 * processes it to build GraphQL query strings/info
 *
 * @param {object} introspectionData
 * @returns {Object} GraphQL query info including gql query strings
 */


const generateNodeQueriesFromIngestibleFields = async () => {
  const {
    remoteSchema,
    gatsbyApi: {
      helpers: {
        reporter
      },
      pluginOptions: {
        debug: {
          graphql: {
            copyNodeSourcingQueryAndExit
          }
        }
      }
    }
  } = _store.default.getState();

  const {
    fieldBlacklist,
    nodeListFilter,
    typeMap,
    ingestibles: {
      nodeListRootFields
    }
  } = remoteSchema;
  const rootFields = typeMap.get(`RootQuery`).fields;
  let nodeQueries = {};

  for (const {
    type,
    name
  } of nodeListRootFields) {
    if (fieldBlacklist.includes(name)) {
      continue;
    } // nested fields


    const fieldFields = typeMap.get(type.name).fields; // a nested field containing a list of nodes

    const nodesField = fieldFields.find(nodeListFilter); // the type of this query

    const nodesType = typeMap.get(nodesField.type.ofType.name);
    const {
      fields,
      possibleTypes
    } = nodesType;
    const settings = (0, _helpers.getTypeSettingsByType)(nodesType);

    if (settings.exclude) {
      continue;
    }

    let nodeListQueries = [];
    const singleNodeRootFieldInfo = rootFields.find(field => field.type.name === nodesType.name);

    if (!singleNodeRootFieldInfo) {
      // @todo handle cases where there is a nodelist field but no individual field. we can't do data updates or preview on this type.
      reporter.warn((0, _formatLogMessage.formatLogMessage)(`Unable to find a single Node query for ${nodesType.name}\n\tThis type will not be available in Gatsby.\n`));
      continue;
    }

    const fragments = {};
    const singleFieldName = singleNodeRootFieldInfo === null || singleNodeRootFieldInfo === void 0 ? void 0 : singleNodeRootFieldInfo.name;
    const transformedFields = (0, _recursivelyTransformFields.default)({
      fields,
      fragments,
      parentType: type,
      mainType: type
    }); // we need this for node interface types on the WPGQL side

    transformedFields.push(`__typename`);
    let transformedInlineFragments;

    if (possibleTypes) {
      transformedInlineFragments = (0, _recursivelyTransformFields.transformInlineFragments)({
        possibleTypes,
        fragments,
        parentType: nodesType,
        mainType: nodesType,
        debug: true,
        // normally we only want the id for gatsby node fields
        // but in this case we're at the top level and need to query
        // these fields
        buildGatsbyNodeFields: true
      }); // alias conflicting inline fragment fields

      transformedInlineFragments = transformedInlineFragments.map((_ref) => {
        let {
          fields
        } = _ref,
            inlineFragment = (0, _objectWithoutPropertiesLoose2.default)(_ref, ["fields"]);
        return Object.assign({}, inlineFragment, {
          fields: aliasConflictingFields({
            transformedFields: fields
          })
        });
      });
    } // mutates the fragments..


    aliasConflictingFragmentFields({
      fragments
    });
    const aliasedTransformedFields = aliasConflictingFields({
      transformedFields,
      parentType: type
    });
    const selectionSet = (0, _buildQueryOnFieldName.buildSelectionSet)(aliasedTransformedFields, {
      fieldPath: name,
      fragments,
      transformedInlineFragments
    });
    const builtFragments = (0, _buildQueryOnFieldName.generateReusableFragments)({
      fragments,
      selectionSet
    });
    const nodeQuery = (0, _buildQueryOnFieldName.buildNodeQueryOnFieldName)({
      fields: transformedFields,
      fieldName: singleFieldName,
      settings,
      builtFragments,
      builtSelectionSet: selectionSet
    });
    const previewQuery = (0, _buildQueryOnFieldName.buildNodeQueryOnFieldName)({
      fields: transformedFields,
      fieldName: singleFieldName,
      fieldInputArguments: `id: $id, idType: ID, asPreview: true`,
      queryName: `PREVIEW_QUERY`,
      settings,
      builtFragments,
      builtSelectionSet: selectionSet
    });
    const fieldVariables = settings.where ? `where: { ${settings.where} }` : ``;

    if (settings.nodeListQueries && typeof settings.nodeListQueries === `function`) {
      const queries = settings.nodeListQueries({
        name,
        fields,
        selectionSet,
        builtFragments,
        singleFieldName,
        singleNodeRootFieldInfo,
        settings,
        store: _store.default,
        fieldVariables,
        remoteSchema,
        transformedFields,
        helpers: {
          recursivelyTransformFields: _recursivelyTransformFields.default,
          buildNodesQueryOnFieldName: _buildQueryOnFieldName.buildNodesQueryOnFieldName
        }
      });

      if (queries && queries.length) {
        nodeListQueries = queries;
      }
    }

    if (!nodeListQueries || !nodeListQueries.length) {
      const nodeListQuery = (0, _buildQueryOnFieldName.buildNodesQueryOnFieldName)({
        fields: transformedFields,
        fieldName: name,
        fieldVariables,
        settings,
        builtFragments,
        builtSelectionSet: selectionSet
      });
      nodeListQueries = [nodeListQuery];
    }

    if (process.env.NODE_ENV === `development` && nodesType.name === copyNodeSourcingQueryAndExit) {
      try {
        reporter.log(``);
        reporter.warn((0, _formatLogMessage.formatLogMessage)(`Query debug mode. Writing node list query for the ${nodesType.name} node type to the system clipboard and exiting\n\n`));
        await _clipboardy2.default.write(_prettier.default.format(nodeListQueries[0], {
          parser: `graphql`
        }));
        process.exit();
      } catch (e) {
        reporter.log(``);
        reporter.error(e);
        reporter.log(``);
        reporter.warn((0, _formatLogMessage.formatLogMessage)(`Query debug mode failed. There was a failed attempt to copy the query for the ${nodesType.name} node type to your clipboard.\n\n`));
        reporter.error(e);
      }
    } // build a query info object containing gql query strings for fetching
    // node lists or single nodes, as well as type info and plugin
    // settings for this type


    nodeQueries[name] = {
      typeInfo: {
        singularName: singleFieldName,
        pluralName: name,
        nodesTypeName: nodesType.name
      },
      nodeListQueries,
      nodeQuery,
      previewQuery,
      selectionSet,
      builtFragments,
      settings
    };
  }

  return nodeQueries;
};

var _default = generateNodeQueriesFromIngestibleFields;
exports.default = _default;