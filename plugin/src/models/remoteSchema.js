import { findTypeName } from "~/steps/create-schema-customization/helpers"

const remoteSchema = {
  state: {
    wpUrl: null,
    nodeQueries: {},
    nonNodeQuery: null,
    introspectionData: null,
    schemaWasChanged: null,
    typeMap: null,
    nodeListFilter: (field) => field.name === `nodes`,
    ingestibles: {
      nodeListRootFields: null,
      nodeInterfaceTypes: null,
      nonNodeRootFields: [],
    },
    fetchedTypes: new Map(),
    fieldBlacklist: [
      `isWpGatsby`,
      `edges`,
      // these aren't useful without authentication
      `revisions`,
      `isJwtAuthSecretRevoked`,
      `isRestricted`,
      `jwtAuthExpiration`,
      `jwtAuthToken`,
      `jwtRefreshToken`,
      `jwtUserSecret`,
      `editLock`,
      `revisionOf`,
      `preview`,
      `isPreview`,
      `previewRevisionDatabaseId`,
      `previewRevisionId`,
      `editingLockedBy`,
    ],
    // @todo make this a plugin option
    fieldAliases: {
      parent: `wpParent`,
      children: `wpChildren`,
      internal: `wpInternal`,
      plugin: `wpPlugin`,
      actionOptions: `wpActionOptions`,
    },
  },

  reducers: {
    setSchemaWasChanged(state, payload) {
      state.schemaWasChanged = !!payload

      return state
    },

    addFieldsToBlackList(state, payload) {
      state.fieldBlacklist = [...state.fieldBlacklist, ...payload]
      return state
    },

    setState(state, payload) {
      state = {
        ...state,
        ...payload,
      }

      return state
    },

    addFetchedType(state, type) {
      const key = findTypeName(type)

      if (!key) {
        return state
      }

      type = state.typeMap.get(key)

      // union types with no member types will cause schema customization errors
      // @todo move this to a better place. This should be excluded before it gets to this point.
      if (type && type.kind === `UNION` && type.possibleTypes.length === 0) {
        return state
      }

      state.fetchedTypes.set(key, type)

      return state
    },
  },
}

export default remoteSchema
