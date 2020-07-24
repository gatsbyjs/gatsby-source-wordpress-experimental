import merge from "lodash/merge"
import { createRemoteMediaItemNode } from "~/steps/source-nodes/create-nodes/create-remote-media-item-node"
import { menuBeforeChangeNode } from "~/steps/source-nodes/before-change-node/menu"
import { categoryBeforeChangeNode } from "~/steps/source-nodes/before-change-node/category"

const defaultPluginOptions = {
  url: null,
  verbose: true,
  debug: {
    graphql: {
      showQueryOnError: false,
      showQueryVarsOnError: false,
      copyQueryOnError: false,
      panicOnError: false,
      onlyReportCriticalErrors: true,
      copyNodeSourcingQueryAndExit: false,
      writeQueriesToDisk: false,
    },
    timeBuildSteps: false,
    disableCompatibilityCheck: false,
  },
  develop: {
    nodeUpdateInterval: 300,
    hardCacheMediaFiles: false,
  },
  production: {
    hardCacheMediaFiles: false,
  },
  auth: {
    htaccess: {
      username: null,
      password: null,
    },
  },
  schema: {
    queryDepth: 15,
    circularQueryLimit: 5,
    typePrefix: `Wp`,
    timeout: 30 * 1000, // 30 seconds
    perPage: 100,
  },
  excludeFieldNames: [],
  html: {
    // this causes the source plugin to find/replace images in html
    useGatsbyImage: true,
    // this adds a limit to the max width an image can be
    // if the image selected in WP is smaller, or the image is smaller than this
    // those values will be used instead.
    imageMaxWidth: null,
    // if a max width can't be inferred from html, this value will be passed to Sharp
    // if the image is smaller than this, the images width will be used instead
    fallbackImageMaxWidth: 100, // @todo this value is too low of a default
    imageQuality: 90,
  },
  type: {
    __all: {
      // @todo make dateFields into a plugin option?? It's not currently
      // this may not be needed since WPGraphQL will be getting a Date type soon
      // dateFields: [`date`],
    },
    RootQuery: {
      excludeFieldNames: [`viewer`, `node`, `schemaMd5`],
    },
    UserToMediaItemConnection: {
      // if this type is not excluded it will potentially fetch an extra 100
      // media items per user during node sourcing
      exclude: true,
    },
    WpContentNodeToEditLockConnectionEdge: {
      exclude: true,
    },
    WPPageInfo: {
      exclude: true,
    },
    ActionMonitorAction: {
      exclude: true,
    },
    UserToActionMonitorActionConnection: {
      exclude: true,
    },
    Plugin: {
      exclude: true,
    },
    Theme: {
      exclude: true,
    },
    MediaItem: {
      lazyNodes: false,
      localFile: {
        excludeByMimeTypes: [],
      },
      beforeChangeNode: async ({ remoteNode, actionType, typeSettings }) => {
        // we fetch lazy nodes files in resolvers, no need to fetch them here.
        if (typeSettings.lazyNodes) {
          return {
            remoteNode,
          }
        }

        if (actionType === `CREATE` || actionType === `UPDATE`) {
          const createdMediaItem = await createRemoteMediaItemNode({
            mediaItemNode: remoteNode,
          })

          if (createdMediaItem) {
            remoteNode.remoteFile = {
              id: createdMediaItem.id,
            }
            remoteNode.localFile = {
              id: createdMediaItem.id,
            }

            return {
              remoteNode,
            }
          }
        }

        return {
          remoteNode,
        }
      },
    },
    ContentNode: {
      nodeInterface: true,
    },
    TermNode: {
      nodeInterface: true,
    },
    Category: {
      // @todo remove this when categories are a flat list in WPGQL
      beforeChangeNode: categoryBeforeChangeNode,
    },
    Menu: {
      /**
       * This is used to fetch child menu items
       * on Menus as it's problematic to fetch them otherwise
       * in WPGQL currently
       *
       * So after a Menu Node is fetched and processed, this function runs
       * It loops through the child menu items, generates a query for them,
       * fetches them, and creates nodes out of them.
       *
       * This runs when initially fetching all nodes, and after an incremental
       * fetch happens
       *
       * When we can get a list of all menu items regardless of location in WPGQL, this can be removed.
       */
      beforeChangeNode: menuBeforeChangeNode,
    },
    MenuItem: {
      /**
       * This was my previous attempt at fetching problematic menuItems
       * I temporarily solved this above, but I'm leaving this here as
       * a reminder of the nodeListQueries API
       *
       * this worked to pull all menus in the initial fetch, but menus had to be assigned to a location
       * that was problematic because saving a menu would then fetch those menu items using the incremental fetching logic in this plugin. So menu items that previously existed in WP wouldn't show up initially if they had no location set, then as menus were saved they would show up.
       */
      // nodeListQueries: ({
      //   name,
      //   store,
      //   transformedFields,
      //   helpers: { buildNodesQueryOnFieldName },
      // }) => {
      //   const menuLocationEnumValues = store
      //     .getState()
      //     .remoteSchema.introspectionData.__schema.types.find(
      //       type => type.name === `MenuLocationEnum`
      //     )
      //     .enumValues.map(value => value.name)
      //   const queries = menuLocationEnumValues.map(enumValue =>
      //     buildNodesQueryOnFieldName({
      //       fields: transformedFields,
      //       fieldName: name,
      //       fieldVariables: `where: { location: ${enumValue} }`,
      //     })
      //   )
      //   return queries
      // },
    },
    // the next two types can't be sourced in Gatsby properly yet
    // @todo instead of excluding these manually, auto exclude them
    // based on how they behave (no single node query available)
    EnqueuedScript: {
      exclude: true,
    },
    EnqueuedStylesheet: {
      exclude: true,
    },
    EnqueuedAsset: {
      exclude: true,
    },
    ContentNodeToEnqueuedScriptConnection: {
      exclude: true,
    },
    ContentNodeToEnqueuedStylesheetConnection: {
      exclude: true,
    },
    TermNodeToEnqueuedScriptConnection: {
      exclude: true,
    },
    TermNodeToEnqueuedStylesheetConnection: {
      exclude: true,
    },
    UserToEnqueuedScriptConnection: {
      exclude: true,
    },
    UserToEnqueuedStylesheetConnection: {
      exclude: true,
    },
  },
}

const gatsbyApi = {
  state: {
    helpers: {},
    pluginOptions: defaultPluginOptions,
  },

  reducers: {
    setState(state, payload) {
      return merge(state, payload)
    },
  },
}

export default gatsbyApi
