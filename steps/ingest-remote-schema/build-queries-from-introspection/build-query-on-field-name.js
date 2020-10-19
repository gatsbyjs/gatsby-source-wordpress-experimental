"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.buildNodeQueryOnFieldName = exports.buildSelectionSet = exports.buildNodesQueryOnFieldName = exports.generateReusableFragments = void 0;

var _graphqlQueryCompress = _interopRequireDefault(require("graphql-query-compress"));

var _store = _interopRequireDefault(require("../../../store"));

var _helpers = require("../../create-schema-customization/helpers");

const buildReusableFragments = ({
  fragments
}) => Object.values(fragments).map(({
  name,
  type,
  fields,
  inlineFragments
}) => `fragment ${name} on ${type} {
      ${buildSelectionSet(fields)}
      ${buildInlineFragments(inlineFragments)}
    }`).join(` `);
/**
 * Takes in a fragments object (built up during the buildSelectionSet function)
 * transforms that object into an actual fragment,
 * then checks for unused fragments and potential regenerates again
 * with the unused fragments removed
 */


const generateReusableFragments = ({
  fragments,
  selectionSet
}) => {
  const fragmentsValues = Object.values(fragments);

  if (!fragmentsValues.length) {
    return ``;
  }

  let builtFragments = buildReusableFragments({
    fragments
  });

  if (fragments) {
    let regenerateFragments = false;
    fragmentsValues.forEach(({
      name,
      type
    }) => {
      // if our query didn't use the fragment due to the query depth AND the fragment isn't used in another fragment, delete it
      // @todo these fragments shouldn't be generated if they wont be used.
      // if we fix this todo, we can use the buildReusableFragments function directly
      // instead of running it twice to remove unused fragments
      if (!selectionSet.includes(`...${name}`) && !builtFragments.includes(`...${name}`)) {
        delete fragments[type];
        regenerateFragments = true;
      }
    });

    if (regenerateFragments) {
      builtFragments = buildReusableFragments({
        fragments
      });
    }
  }

  return builtFragments;
};

exports.generateReusableFragments = generateReusableFragments;

const buildNodesQueryOnFieldName = ({
  fieldName,
  builtSelectionSet,
  builtFragments = ``,
  queryVariables = ``,
  fieldVariables = ``
}) => (0, _graphqlQueryCompress.default)(buildQuery({
  queryName: `NODE_LIST_QUERY`,
  variables: `$first: Int!, $after: String, ${queryVariables}`,
  fieldName,
  fieldVariables: `first: $first, after: $after, ${fieldVariables}`,
  builtSelectionSet: `
        nodes {
          ${builtSelectionSet}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      `,
  builtFragments
}));

exports.buildNodesQueryOnFieldName = buildNodesQueryOnFieldName;

const buildVariables = variables => variables && typeof variables === `string` ? `(${variables})` : ``;

const buildInlineFragment = ({
  name,
  fields,
  fragments
}) => `
  ... on ${name} {
    ${buildSelectionSet(fields, {
  fragments
})}
  }
`;

const buildInlineFragments = (inlineFragments, {
  fragments = {}
} = {}) => inlineFragments ? `
      __typename
      ${inlineFragments.map(inlineFragment => buildInlineFragment(Object.assign({}, inlineFragment, {
  fragments
}))).join(` `)}
    ` : ``;

const buildSelectionSet = (fields, {
  fragments = {},
  transformedInlineFragments = []
} = {}) => {
  if (!fields || !fields.length) {
    return ``;
  }

  const {
    remoteSchema: {
      typeMap
    }
  } = _store.default.getState();

  const buildFieldSelectionSet = field => {
    if (typeof field === `string`) {
      return field;
    }

    let {
      fieldName,
      variables,
      fields,
      inlineFragments,
      fieldType,
      internalType,
      builtSelectionSet
    } = field;

    if (internalType === `Fragment`) {
      return `...${field.fragment.name}`;
    }

    if ((!variables || variables === ``) && (fields === null || fields === void 0 ? void 0 : fields.find(field => field.fieldName === `nodes`))) {
      // @todo instead of checking for a nodes field, include the field type here
      // and check for input args instead. Maybe some kind of input args API or something would be helpful
      variables = `first: 100`;
    }

    const selectionSet = builtSelectionSet || buildSelectionSet(fields, {
      fragments
    });
    const builtInlineFragments = buildInlineFragments(inlineFragments, {
      fragments
    });

    if (fieldName && (builtInlineFragments !== `` || selectionSet !== ``)) {
      return `
        ${fieldName} ${buildVariables(variables)} {
          ${selectionSet}
          ${builtInlineFragments}
        }
      `;
    } else if (fieldName) {
      const fullFieldType = typeMap.get((0, _helpers.findTypeName)(fieldType)); // if this field has subfields but we didn't build a selection set for it
      // we shouldn't fetch this field. This can happen when we have self referencing types that are limited by the schema.circularQueryLimit plugin option.
      // @todo the above should be fixed in recursively-transform-fields.js instead of here. recursion is hard :p

      if (fullFieldType.fields) {
        return null;
      }

      return fieldName;
    }

    return null;
  };

  let inlineFragmentsSelectionSet = ``;

  if (transformedInlineFragments === null || transformedInlineFragments === void 0 ? void 0 : transformedInlineFragments.length) {
    inlineFragmentsSelectionSet = transformedInlineFragments.map(inlineFragment => {
      return `... on ${inlineFragment.name} {
        ${inlineFragment.fields.map(buildFieldSelectionSet).filter(Boolean).join(`
        `)}
      }`;
    });
  }

  const selectionSet = fields.map(buildFieldSelectionSet).filter(Boolean).join(`
    `);
  return `${inlineFragmentsSelectionSet} ${selectionSet}`;
};

exports.buildSelectionSet = buildSelectionSet;

const buildQuery = ({
  queryName,
  fieldName,
  fieldVariables,
  variables,
  builtSelectionSet,
  builtFragments = ``
}) => `
  query ${queryName} ${buildVariables(variables)} {
    ${fieldName} ${buildVariables(fieldVariables)} {
      ${builtSelectionSet}
    }
  }

  ${builtFragments}
`;

const buildNodeQueryOnFieldName = ({
  fieldName,
  builtFragments,
  builtSelectionSet,
  variables = `$id: ID!`,
  fieldInputArguments = `id: $id`,
  queryName = `SINGLE_CONTENT_QUERY`
}) => (0, _graphqlQueryCompress.default)(buildQuery({
  queryName,
  variables,
  fieldName,
  fieldVariables: fieldInputArguments,
  builtFragments,
  builtSelectionSet
}));

exports.buildNodeQueryOnFieldName = buildNodeQueryOnFieldName;