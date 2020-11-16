import store from "~/store"

import { fieldOfTypeWasFetched } from "./helpers"

import buildType from "./build-types"
import { getGatsbyNodeTypeNames } from "../source-nodes/fetch-nodes/fetch-nodes"
import { typeIsExcluded } from "~/steps/ingest-remote-schema/is-excluded"

/**
 * createSchemaCustomization
 */
const customizeSchema = async ({ actions, schema }) => {
  const state = store.getState()

  const {
    gatsbyApi: { pluginOptions },
    remoteSchema,
  } = state

  const {
    fieldAliases,
    fieldBlacklist,
    ingestibles: { nonNodeRootFields },
  } = remoteSchema

  const typeDefs = []

  const gatsbyNodeTypes = getGatsbyNodeTypeNames()

  const typeBuilderApi = {
    typeDefs,
    schema,
    gatsbyNodeTypes,
    fieldAliases,
    fieldBlacklist,
    pluginOptions,
  }

  // create Gatsby node types
  remoteSchema.introspectionData.__schema.types.forEach((type) => {
    if (
      fieldOfTypeWasFetched(type) &&
      !typeIsExcluded({ pluginOptions, typeName: type.name })
    ) {
      switch (type.kind) {
        case `UNION`:
          buildType.unionType({ ...typeBuilderApi, type })
          break
        case `INTERFACE`:
          buildType.interfaceType({ ...typeBuilderApi, type })
          break
        case `OBJECT`:
          buildType.objectType({ ...typeBuilderApi, type })
          break
        case `ENUM`:
          buildType.enumType({ ...typeBuilderApi, type })
          break
        case `SCALAR`:
          /**
           * custom scalar types aren't imlemented currently.
           *  @todo make this hookable so sub-plugins or plugin options can add custom scalar support.
           */
          break
      }
    }
  })

  // Create non Gatsby node types by creating a single node
  // where the typename is the type prefix
  // The node fields are the non-node root fields of the remote schema
  // like so: query { prefix { ...fields } }
  buildType.objectType({
    ...typeBuilderApi,
    type: {
      kind: `OBJECT`,
      name: pluginOptions.schema.typePrefix,
      description: `Non-node WPGraphQL root fields.`,
      fields: nonNodeRootFields,
      interfaces: [`Node`],
    },
    isAGatsbyNode: true,
  })

  actions.createTypes(typeDefs)
}

const createSchemaCustomization = async (api) => {
  try {
    await customizeSchema(api)
  } catch (e) {
    api.reporter.panic(e)
  }
}

export { createSchemaCustomization }
