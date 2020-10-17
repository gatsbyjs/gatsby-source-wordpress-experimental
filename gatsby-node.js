const listeningToNodes = {}

const { runApisInSteps } = require("./dist/utils/run-steps")
const steps = require("./dist/steps/index")

module.exports = runApisInSteps({
  onPreInit: [steps.setErrorMap],

  createSchemaCustomization: [
    steps.setGatsbyApiToState,
    steps.ensurePluginRequirementsAreMet,
    steps.ingestRemoteSchema,
    steps.createSchemaCustomization,
  ],

  sourceNodes: [
    step.setGatsbyApiToState,
    [step.persistPreviouslyCachedImages, step.sourcePreviews, step.sourceNodes],
    step.setImageNodeIdCache,
  ],

  onPostBuild: [steps.setImageNodeIdCache],

  onCreatePage: [
    (helpers, pluginOptions) => {
      return
      const { page, store, getNode } = helpers

      const contextNode =
        page.context && page.context.id && getNode(page.context.id)

      let nodeThatCreatedThisPage = contextNode

      // we want to try to get the node by context id
      // because otherwise we need to look it up expensively in componentDataDependencies
      if (!nodeThatCreatedThisPage) {
        const state = store.getState()

        function getMapKeyByValue(val) {
          /**
           * this is expensive because we're looking up a map key (node id) by wether our value exists within it's value which is an array of page paths
           */
          const returnedEntries = [
            ...state.componentDataDependencies.nodes,
          ].find(([, value]) => [...value].includes(val))

          if (returnedEntries && returnedEntries.length) {
            return returnedEntries[0]
          }

          return null
        }

        const nodeId = getMapKeyByValue(page.path)
        nodeThatCreatedThisPage = getNode(nodeId)
      }

      if (nodeThatCreatedThisPage) {
      }
    },
  ],

  onCreateNode: [
    ({ node }) => {
      return
      if (
        node.internal.type === `SitePage` &&
        node.context &&
        node.context.id &&
        listeningToNodes[node.context.id]
      ) {
        listeningToNodes[node.context.id](node)
      } else if (node && node.id && listeningToNodes[node.id]) {
        listeningToNodes[node.id](node)
      }
    },
  ],

  onCreateDevServer: [
    steps.setupPreviewRefresher,
    steps.setImageNodeIdCache,
    steps.startPollingForContentUpdates,
  ],
})
