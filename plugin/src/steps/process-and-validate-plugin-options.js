import store from "~/store"
import { formatLogMessage } from "~/utils/format-log-message"
import isInteger from "lodash/isInteger"

const optionsProcessors = [
  {
    name: `pluginOptions.type.MediaItem.limit is not allowed`,
    test: ({ userPluginOptions }) =>
      !!userPluginOptions?.type?.MediaItem?.limit,
    processor: ({ helpers, userPluginOptions }) => {
      helpers.reporter.panic(
        formatLogMessage(
          `PluginOptions.type.MediaItem.limit is an disallowed plugin option.\nPlease remove the MediaItem.limit option from gatsby-config.js (currently set to ${userPluginOptions?.type?.MediaItem?.limit})\n\nMediaItem nodes are automatically limited to 0 and then fetched only when referenced by other node types. For example as a featured image, in custom fields, or in post_content.`
        )
      )
    },
  },
  {
    name: `excludeFields-renamed-to-excludeFieldNames`,
    test: ({ userPluginOptions }) =>
      userPluginOptions?.excludeFields?.length ||
      userPluginOptions?.excludeFieldNames?.length,
    processor: ({ helpers, userPluginOptions }) => {
      if (userPluginOptions?.excludeFields?.length) {
        helpers.reporter.log(``)
        helpers.reporter.warn(
          formatLogMessage(
            // @todo
            `\n\nPlugin options excludeFields has been renamed to excludeFieldNames.\nBoth options work for now, but excludeFields will be removed in a future version\n(likely when we get to beta) in favour of excludeFieldNames.\n\n`
          )
        )
      }

      store.dispatch.remoteSchema.addFieldsToBlackList(
        userPluginOptions.excludeFieldNames || userPluginOptions.excludeFields
      )

      return userPluginOptions
    },
  },
  {
    name: `queryDepth-is-not-a-positive-int`,
    test: ({ userPluginOptions }) =>
      typeof userPluginOptions?.schema?.queryDepth !== `undefined` &&
      (!isInteger(userPluginOptions?.schema?.queryDepth) ||
        userPluginOptions?.schema?.queryDepth <= 0),
    processor: ({ helpers, userPluginOptions }) => {
      helpers.reporter.log(``)
      helpers.reporter.warn(
        formatLogMessage(
          `\n\npluginOptions.schema.queryDepth is not a positive integer.\nUsing default value in place of provided value.\n`,
          { useVerboseStyle: true }
        )
      )

      delete userPluginOptions.schema.queryDepth

      return userPluginOptions
    },
  },
]

export const processAndValidatePluginOptions = (helpers, pluginOptions) => {
  let userPluginOptions = {
    ...pluginOptions,
  }

  optionsProcessors.forEach(({ test, processor, name }) => {
    if (!name) {
      helpers.reporter.panic(
        formatLogMessage(
          `Plugin option filter is unnamed\n\n${test.toString()}\n\n${processor.toString()}`
        )
      )
    }

    if (test({ helpers, userPluginOptions })) {
      const filteredUserPluginOptions = processor({
        helpers,
        userPluginOptions,
      })

      if (filteredUserPluginOptions) {
        userPluginOptions = filteredUserPluginOptions
      } else {
        helpers.reporter.panic(
          formatLogMessage(
            `Plugin option filter ${name} didn't return a filtered options object`
          )
        )
      }
    }
  })

  return userPluginOptions
}
