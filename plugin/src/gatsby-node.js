import { runApisInSteps } from "./utils/run-steps"
import * as steps from "./steps"

module.exports = runApisInSteps({
  onPreInit: [steps.setErrorMap],

  createSchemaCustomization: [
    steps.setGatsbyApiToState,
    steps.ensurePluginRequirementsAreMet,
    steps.ingestRemoteSchema,
    [steps.createSchemaCustomization, steps.addPreviewStatusField],
  ],

  createResolvers: [steps.addPreviewStatusResolver],

  sourceNodes: [
    steps.setGatsbyApiToState,
    [steps.persistPreviouslyCachedImages, steps.sourceNodes],
    steps.setImageNodeIdCache,
  ],

  onPreExtractQueries: [steps.invokeAndCleanupLeftoverPreviewCallbacks],

  onPostBuild: [steps.setImageNodeIdCache],

  onCreatePage: [
    steps.savePreviewNodeIdToPageDependency,
    steps.onCreatePageRespondToPreviewStatusQuery,
  ],

  onCreateDevServer: [
    steps.setImageNodeIdCache,
    steps.startPollingForContentUpdates,
  ],
})
