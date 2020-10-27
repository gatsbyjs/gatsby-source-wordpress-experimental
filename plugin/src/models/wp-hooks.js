const wpHooks = {
  state: {
    nodeFilters: {},
  },

  reducers: {
    addNodeFilter(state, nodeFilter) {
      const { name, filter, priority = 10 } = nodeFilter

      if (!name || typeof filter === `undefined`) {
        return state
      }

      state.nodeFilters[nodeFilter.name] = [
        ...(state.nodeFilters?.[nodeFilter.name] || []),
        {
          name,
          filter,
          priority,
        },
      ]

      return state
    },
  },
}

export default wpHooks
