// `node` here is a Gatsby node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OnPageCreatedCallback = (node: any) => Promise<void>

interface StoredPage {
  path: string
  updatedAt: number
}

interface IPreviewState {
  nodePageCreatedCallbacks: {
    [nodeId: string]: OnPageCreatedCallback
  }
  nodeIdsToCreatedPages: {
    [nodeId: string]: {
      page: StoredPage
    }
  }
  pagePathToNodeDependencyId: {
    [pageId: string]: {
      nodeId: string
    }
  }
}

interface PreviewReducers {
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
  clearPreviewCallbacks: (state: IPreviewState) => IPreviewState
  saveNodePageState: (
    state: IPreviewState,
    payload: {
      nodeId: string
      page: StoredPage
    }
  ) => IPreviewState
}

interface IPreviewStore {
  state: IPreviewState
  reducers: PreviewReducers
}

const previewStore: IPreviewStore = {
  state: {
    nodePageCreatedCallbacks: {},
    nodeIdsToCreatedPages: {},
    pagePathToNodeDependencyId: {},
  },

  reducers: {
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

    clearPreviewCallbacks(state) {
      state.nodePageCreatedCallbacks = {}

      return state
    },

    saveNodePageState(state, { page, nodeId }) {
      state.nodeIdsToCreatedPages[nodeId] = {
        page,
      }

      state.pagePathToNodeDependencyId[page.path] = {
        nodeId,
      }

      return state
    },
  } as PreviewReducers,
}

export default previewStore
