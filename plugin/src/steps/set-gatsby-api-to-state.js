import store from "~/store"
import { processAndValidatePluginOptions } from "./process-and-validate-plugin-options"

const setGatsbyApiToState = (helpers, pluginOptions) => {
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
}

export { setGatsbyApiToState }
