import { GatsbyReporter, GatsbyNodeApiHelpers } from "./gatsby-types"
import { IPluginOptions } from "~/models/gatsby-api"
import { formatLogMessage } from "~/utils/format-log-message"
import { invokeAndCleanupLeftoverPreviewCallbacks } from "../steps/preview/cleanup"
import { CODES } from "./report"

type Step = (
  helpers: GatsbyNodeApiHelpers,
  pluginOptions: IPluginOptions
) => Promise<void>

const runSteps = async (
  steps: Step[],
  helpers: GatsbyNodeApiHelpers,
  pluginOptions: IPluginOptions,
  apiName: string
): Promise<void> => {
  for (const step of steps) {
    try {
      const { timeBuildSteps } = pluginOptions?.debug ?? {}
      const timeStep =
        typeof timeBuildSteps === `boolean`
          ? timeBuildSteps
          : timeBuildSteps?.includes(step.name) ||
            timeBuildSteps?.includes(apiName)

      let activity: GatsbyReporter

      if (timeStep) {
        activity = helpers.reporter.activityTimer(
          formatLogMessage(`step -${!apiName ? `-` : ``}> ${step.name}`, {
            useVerboseStyle: true,
          })
        )
        activity.start()
      }

      if (typeof step === `function`) {
        await step(helpers, pluginOptions)
      } else if (Array.isArray(step)) {
        await runSteps(step, helpers, pluginOptions, apiName)
      }

      if (activity) {
        activity.end()
      }
    } catch (e) {
      const sharedError = `Encountered a critical error when running the ${
        apiName ? `${apiName}.` : ``
      }${step.name} build step.`

      // on errors, invoke any preview callbacks to send news of this error back to the WP Preview window.
      await invokeAndCleanupLeftoverPreviewCallbacks({
        status: `GATSBY_PREVIEW_PROCESS_ERROR`,
        context: sharedError,
        error: e,
      })

      helpers.reporter.error(e.message)
      helpers.reporter.panic({
        id: CODES.SourcePluginCodeError,
        context: {
          sourceMessage: formatLogMessage(
            `\n\n\t${sharedError}\n\tSee above for more information.`,
            { useVerboseStyle: true }
          ),
        },
      })
    }
  }
}

const runApiSteps = (steps: Step[], apiName: string) => async (
  helpers: GatsbyNodeApiHelpers,
  pluginOptions: IPluginOptions
): Promise<void> => runSteps(steps, helpers, pluginOptions, apiName)

const runApisInSteps = (nodeApis: {
  [apiName: string]: Step | Step[]
}): { [apiName: string]: Promise<void> } =>
  Object.entries(nodeApis).reduce(
    (gatsbyNodeExportObject, [apiName, apiSteps]) => {
      return {
        ...gatsbyNodeExportObject,
        [apiName]:
          typeof apiSteps === `function`
            ? apiSteps
            : runApiSteps(apiSteps, apiName),
      }
    },
    {}
  )

export { runSteps, runApisInSteps }
