// `node` here is a Gatsby node
type OnPageCreatedCallback = (node: any) => void

interface IPreviewState {
  nodePageCreatedCallbacks: {
    [nodeId: string]: OnPageCreatedCallback
  }
  nodePageCreatedStateByNodeId: {
    [nodeId: string]: {
      // gatsby node page type
      page: any
    }
  }
  pageIdToNodeDependencyId: {
    [pageId: string]: {
      nodeId: string
    }
  }
}

type PreviewReducers = {
  subscribeToPagesCreatedFromNodeById: (
    state: IPreviewState,
    payload: { nodeId: string; onPageCreatedCallback: OnPageCreatedCallback }
  ) => IPreviewState
  saveNodePageState: (
    state: IPreviewState,
    payload: { nodeId: string; page: any }
  ) => IPreviewState
}

interface IPreviewStore {
  state: IPreviewState
  reducers: PreviewReducers
}

const previewStore: IPreviewStore = {
  state: {
    nodePageCreatedCallbacks: {},
    nodePageCreatedStateByNodeId: {},
    pageIdToNodeDependencyId: {},
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

    saveNodePageState(state, { page, nodeId }) {
      state.nodePageCreatedStateByNodeId[nodeId] = {
        page,
      }

      state.pageIdToNodeDependencyId[page.id] = {
        nodeId,
      }

      return state
    },
  },
}

export default previewStore
