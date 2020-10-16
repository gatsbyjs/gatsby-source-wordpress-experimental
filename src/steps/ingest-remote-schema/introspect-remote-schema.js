import store from "~/store"
import { setPersistentCache, getPersistentCache } from "~/utils/cache"
import fetchGraphql from "~/utils/fetch-graphql"
import { introspectionQuery } from "~/utils/graphql-queries"

const introspectAndStoreRemoteSchema = async () => {
  const state = store.getState()
  const { pluginOptions } = state.gatsbyApi
  const { schemaWasChanged } = state.remoteSchema

  const INTROSPECTION_CACHE_KEY = `${pluginOptions.url}--introspection-data`
  let introspectionData = await getPersistentCache({
    key: INTROSPECTION_CACHE_KEY,
  })

  if (!introspectionData || schemaWasChanged) {
    const { data } = await fetchGraphql({
      query: introspectionQuery,
    })

    introspectionData = data

    // cache introspection response
    await setPersistentCache({
      key: INTROSPECTION_CACHE_KEY,
      value: introspectionData,
    })
  }

  const typeMap = new Map(
    introspectionData.__schema.types.map((type) => [type.name, type])
  )

  store.dispatch.remoteSchema.setState({ introspectionData, typeMap })
}

export { introspectAndStoreRemoteSchema }
