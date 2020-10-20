// `node` here is a Gatsby node
type OnPageCreatedCallback = (node: any) => void

interface IPreviewState {
  nodePageCreatedCallbacks: {
    [nodeId: string]: OnPageCreatedCallback
  }
}

type PreviewReducers = {
  subscribeToPagesCreatedFromNodeById: (
    state: IPreviewState,
    payload: { nodeId: string; onPageCreatedCallback: OnPageCreatedCallback }
  ) => void
}

interface IPreviewStore {
  state: IPreviewState
  reducers: PreviewReducers
}

const previewStore: IPreviewStore = {
  state: {
    nodePageCreatedCallbacks: {},
  },

  reducers: {
    subscribeToPagesCreatedFromNodeById(
      state,
      { nodeId, onPageCreatedCallback }
    ) {
      // save the callback for this nodeId
      // when a page is created from a node that has this id,
      // the callback will be invoked
      state.nodePageCreatedCallbacks[nodeId] = onPageCreatedCallback

      return state
    },
  },
}

export default previewStore
