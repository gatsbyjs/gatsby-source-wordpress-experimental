import { stripImageSizesFromUrl } from "~/steps/source-nodes/fetch-nodes/fetch-referenced-media-items"

const imageNodes = {
  state: {
    nodeMetaByUrl: {},
    nodeIds: [],
  },

  reducers: {
    setState(state, payload) {
      state = {
        ...state,
        ...payload,
      }

      return state
    },

    setNodeIds(_, payload) {
      return {
        nodeIds: payload,
      }
    },

    pushNodeMeta(state, { id, sourceUrl, modifiedGmt }) {
      state.nodeIds.push(id)
      state.nodeMetaByUrl[stripImageSizesFromUrl(sourceUrl)] = {
        id,
        modifiedGmt,
      }

      return state
    },
  },
}

export default imageNodes
