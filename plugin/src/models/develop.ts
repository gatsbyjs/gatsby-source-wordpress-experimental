interface IDevelopState {
  pauseRefreshPolling: boolean
}

interface IDevelopReducers {
  pauseRefreshPolling: (state: IDevelopState) => IDevelopState
  resumeRefreshPolling: (state: IDevelopState) => IDevelopState
}

interface IPreviewStore {
  state: IDevelopState
  reducers: IDevelopReducers
}

const developStore: IPreviewStore = {
  state: {
    pauseRefreshPolling: false,
  },

  reducers: {
    pauseRefreshPolling(state) {
      if (
        process.env.NODE_ENV === `development` &&
        !process.env.ENABLE_GATSBY_REFRESH_ENDPOINT
      ) {
        state.pauseRefreshPolling = true
      }

      return state
    },
    resumeRefreshPolling(state) {
      if (
        process.env.NODE_ENV === `development` &&
        !process.env.ENABLE_GATSBY_REFRESH_ENDPOINT
      ) {
        state.pauseRefreshPolling = false
      }

      return state
    },
  } as IDevelopReducers,
}

export default developStore
