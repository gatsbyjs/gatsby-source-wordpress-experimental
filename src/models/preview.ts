// `node` here is a Gatsby node
type OnPageCreatedCallback = (node: any) => void

interface IPreviewState {
  inPreviewMode: boolean
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
  enablePreviewMode: (state: IPreviewState) => IPreviewState
  subscribeToPagesCreatedFromNodeById: (
    state: IPreviewState,
    payload: {
      nodeId: string
      onPageCreatedCallback: OnPageCreatedCallback
      modified: string
    }
  ) => IPreviewState
  unSubscribeToPagesCreatedFromNodeById: (
    state: IPreviewState,
    payload: {
      nodeId: string
    }
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
    inPreviewMode: false,
    nodePageCreatedCallbacks: {},
    nodePageCreatedStateByNodeId: {},
    pageIdToNodeDependencyId: {},
  },

  reducers: {
    enablePreviewMode(state) {
      if (!state.inPreviewMode) {
        console.log(`enabling preview mode!`)
      }

      state.inPreviewMode = true

      return state
    },

    unSubscribeToPagesCreatedFromNodeById(state, { nodeId }) {
      if (state.nodePageCreatedCallbacks?.[nodeId]) {
        delete state.nodePageCreatedCallbacks[nodeId]
      }

      return state
    },

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

      state.pageIdToNodeDependencyId[page.path] = {
        nodeId,
      }

      return state
    },
  },
}

export default previewStore
