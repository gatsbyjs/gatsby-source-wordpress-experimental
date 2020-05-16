import store from "~/store"
import { formatLogMessage } from "~/utils/format-log-message"
import isInteger from "lodash/isInteger"

const optionsProcessors = [
  {
    name: `excludeFields-renamed-to-excludeFieldNames`,
    test: ({ pluginOptions }) =>
      pluginOptions?.excludeFields?.length ||
      pluginOptions?.excludeFieldName?.length,
    processor: ({ helpers, pluginOptions }) => {
      if (pluginOptions?.excludeFields?.length) {
        helpers.reporter.log(``)
        helpers.reporter.warn(
          formatLogMessage(
            // @todo
            `\n\nPlugin options excludeFields has been renamed to excludeFieldNames.\nBoth options work for now, but excludeFields will be removed in a future version\n(likely when we get to beta) in favour of excludeFieldNames.\n\n`
          )
        )
      }

      if (
        pluginOptions?.excludeFieldNames?.length ||
        // @todo remove excludeFields option in beta release since it's been renamed to excludeFieldNames
        pluginOptions?.excludeFields?.length
      ) {
        store.dispatch.remoteSchema.addFieldsToBlackList(
          pluginOptions.excludeFieldNames || pluginOptions.excludeFields
        )
      }
    },
  },
  {
    name: `queryDepth-is-not-a-positive-int`,
    test: ({ pluginOptions }) =>
      !isInteger(pluginOptions.schema.queryDepth) ||
      pluginOptions.schema.queryDepth <= 0,
    processor: ({ helpers, pluginOptions }) => {
      helpers.reporter.log(``)
      helpers.reporter.warn(
        formatLogMessage(
          `\n\npluginOptions.schema.queryDepth is not a positive integer.\nUsing default value in place of provided value.\n`,
          { useVerboseStyle: true }
        )
      )

      delete pluginOptions.schema.queryDepth

      return pluginOptions
    },
  },
]

export const processAndValidatePluginOptions = (helpers, pluginOptions) => {
  let pluginOptionsCopy = {
    ...pluginOptions,
  }

  optionsProcessors.forEach(({ test, processor }) => {
    if (test({ helpers, pluginOptions: pluginOptionsCopy })) {
      pluginOptionsCopy = processor({
        helpers,
        pluginOptions: pluginOptionsCopy,
      })
    }
  })

  return pluginOptionsCopy
}
