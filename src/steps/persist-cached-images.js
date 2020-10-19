import store from "~/store"
import { getGatsbyApi } from "~/utils/get-gatsby-api"
import { getPersistentCache } from "~/utils/cache"

const persistPreviouslyCachedImages = async () => {
  const { helpers } = getGatsbyApi()

  // load up image node id's from cache
  const imageNodeIds = await getPersistentCache({ key: `image-node-ids` })

  // if they exist,
  if (imageNodeIds && imageNodeIds.length) {
    // touch them all so they don't get garbage collected by Gatsby
    imageNodeIds.forEach((nodeId) =>
      helpers.actions.touchNode({
        nodeId,
      })
    )

    // and set them to state to set back to cache later
    // since we may append more image id's to the store down the line
    // in onPostBuild, all imageNodeIds in state are cached for the next build
    store.dispatch.imageNodes.setNodeIds(imageNodeIds)
  }

  const imageNodeMetaByUrl = await getPersistentCache({
    key: `image-node-meta-by-url`,
  })

  if (imageNodeMetaByUrl) {
    store.dispatch.imageNodes.setState({
      nodeMetaByUrl: imageNodeMetaByUrl,
    })
  }
}

export { persistPreviouslyCachedImages }
