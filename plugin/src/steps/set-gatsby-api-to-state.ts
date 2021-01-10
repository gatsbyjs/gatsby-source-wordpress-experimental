import store from "~/store"
import { processAndValidatePluginOptions } from "./process-and-validate-plugin-options"
import { formatLogMessage } from "../utils/format-log-message"
import { IPluginOptions } from "~/models/gatsby-api"
import { GatsbyNodeApiHelpers } from "~/utils/gatsby-types"

let hasDisplayedPreviewPresetMessage = false

const setGatsbyApiToState = (
  helpers: GatsbyNodeApiHelpers,
  pluginOptions: IPluginOptions
): void => {
  if (helpers.traceId === `refresh-createSchemaCustomization`) {
    return
  }

  const filteredPluginOptions = processAndValidatePluginOptions(
    helpers,
    pluginOptions
  )

  //
  // add the plugin options and Gatsby API helpers to our store
  // to access them more easily
  store.dispatch.gatsbyApi.setState({
    helpers,
    pluginOptions: filteredPluginOptions,
  })

  if (!hasDisplayedPreviewPresetMessage) {
    const { activePluginOptionsPresets, helpers } = store.getState().gatsbyApi

    if (activePluginOptionsPresets?.length) {
      const previewOptimizationPreset = activePluginOptionsPresets.find(
        ({ presetName }) => presetName === `PREVIEW_OPTIMIZATION`
      )

      if (previewOptimizationPreset) {
        helpers.reporter.info(
          formatLogMessage(
            `\nSince the "Preview Optimization" plugin option preset is enabled\nwe aren't fetching more than ${previewOptimizationPreset.options.type.__all.limit} nodes of each type.\nAdditionally, Gatsby image and static file links in HTML fields are disabled.\nIf you want to change this, please check the Preview docs for this plugin.\nhttps://github.com/gatsbyjs/gatsby-source-wordpress-experimental/blob/master/docs/features/preview.md`
          )
        )
      }
    }

    hasDisplayedPreviewPresetMessage = true
  }
}

export { setGatsbyApiToState }
