- The `nodeUpdateInterval` option specifies in milliseconds how often Gatsby will ask WP what data has changed during development. If you want to see data update in near-realtime while you're developing, set this low. Your server may have trouble responding to too many requests over a long period of time and in that case, set this high. Setting it higher saves electricity too ⚡️🌲

```js
{
  url: null,
  verbose: false,
  debug: {
    graphql: {
      showQueryVarsOnError: false,
      panicOnError: false,
      onlyReportCriticalErrors: true,
      writeQueriesToDisk: false,
    },
  },
  develop: {
    nodeUpdateInterval: 300,
    hardCacheMediaFiles: false,
  },
  auth: {
    htaccess: {
      username: null,
      password: null,
    },
  },
  schema: {
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
    fallbackImageMaxWidth: 100,
    imageQuality: 90,
  },
  type: {
    __all: {},
    RootQuery: {
      excludeFieldNames: [`viewer`, `node`, `schemaMd5`],
    },
    Settings: {
      excludeFieldNames: [`generalSettingsEmail`],
    },
    GeneralSettings: {
      excludeFieldNames: [`email`],
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
    PostFormat: {
      exclude: true,
    },
    Theme: {
      exclude: true,
    },
    UserRole: {
      exclude: true,
    },
    UserToUserRoleConnection: {
      exclude: true,
    },
    Page: {
      excludeFieldNames: [`enclosure`],
    },
    User: {
      excludeFieldNames: [
        `extraCapabilities`,
        `capKey`,
        `email`,
        `registeredDate`,
      ],
    },
    MediaItem: {
      lazyNodes: false,
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
      // @todo remove this when menus are a flat list in WPGQL
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
```