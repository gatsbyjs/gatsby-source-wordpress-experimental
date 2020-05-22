import { formatLogMessage } from "~/utils/format-log-message"

const runSteps = async (steps, helpers, pluginOptions, apiName) => {
  for (const step of steps) {
    try {
      if (pluginOptions?.debug?.timeBuildSteps) {
        const activity = helpers.reporter.activityTimer(
          formatLogMessage(`step -${!apiName ? `-` : ``}> ${step.name}`, {
            useVerboseStyle: true,
          })
        )
        activity.start()

        await step(helpers, pluginOptions)

        activity.end()
        continue
      }

      await step(helpers, pluginOptions)
    } catch (e) {
      helpers.reporter.error(e)
      helpers.reporter.panic(
        formatLogMessage(
          `\n\n\tEncountered a critical error when running the ${apiName}.${step.name} build step.\n\tSee above for more information.`,
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
    (gatsbyNodeExportObject, [apiName, apiSteps]) => ({
      ...gatsbyNodeExportObject,
      [apiName]: runApiSteps(apiSteps, apiName),
    }),
    {}
  )

export { runSteps, runApisInSteps }
