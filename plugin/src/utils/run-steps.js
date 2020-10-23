import { formatLogMessage } from "~/utils/format-log-message"

const runSteps = async (steps, helpers, pluginOptions, apiName) => {
  for (const step of steps) {
    try {
      const { timeBuildSteps } = pluginOptions?.debug ?? {}
      const timeStep =
        typeof timeBuildSteps === `boolean`
          ? timeBuildSteps
          : timeBuildSteps?.includes(step.name) ||
            timeBuildSteps?.includes(apiName)

      let activity

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
      helpers.reporter.error(e)
      helpers.reporter.panic(
        formatLogMessage(
          `\n\n\tEncountered a critical error when running the ${
            apiName ? `${apiName}.` : ``
          }${step.name} build step.\n\tSee above for more information.`,
          { useVerboseStyle: true }
        )
      )
    }
  }
}

const runApiSteps = (steps, apiName) => async (helpers, pluginOptions) =>
  runSteps(steps, helpers, pluginOptions, apiName)

const runApisInSteps = (nodeApis) =>
  Object.entries(nodeApis).reduce(
    (gatsbyNodeExportObject, [apiName, apiSteps]) => {
      return {
        ...gatsbyNodeExportObject,
        [apiName]: runApiSteps(apiSteps, apiName),
      }
    },
    {}
  )

export { runSteps, runApisInSteps }
