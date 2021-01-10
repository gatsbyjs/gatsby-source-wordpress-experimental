import { JSON } from "../utils/fetch-graphql"
import store from "~/store"

interface INodeFilterInput {
  name: string
  context: JSON
  data: JSON
}

type NodeFilterFn = (INodeFilterInput) => JSON

interface INodeFilter {
  name: string
  filter: NodeFilterFn
  priority: number
}

/**
 * Grabs an array of filter functions from the redux store,
 * orders them by priority, and then runs each in order over the
 * passed in data. The modified data is then returned
 *
 * @param {string} name The name of the filter to apply
 * @param {object} context Any additional data to pass to the filter functions that are applied
 * @param {object} data The initial data to be filtered
 */
export const applyNodeFilter = async ({
  name,
  context,
  data,
}: INodeFilterInput): Promise<JSON> => {
  if (!name) {
    return data
  }

  const nodeFilters: INodeFilter[] = store.getState().wpHooks.nodeFilters?.[
    name
  ]

  if (!nodeFilters || !nodeFilters.length) {
    return data
  }

  const sortedNodeFilters = nodeFilters.sort((a, b) => a.priority - b.priority)

  for (const { filter } of sortedNodeFilters) {
    data = filter({ data, context, name })
  }

  return data
}

/**
 * This function adds a filter to the internal redux store of filters
 * To be applied via applyNodeFilter above
 *
 * @param {string} name The name of the filter
 * @param {function} filter The function to run when applying this filter
 * @param {integer} priority The priority for this filter to run in. lower means earlier execution
 */
export const addNodeFilter = ({ name, filter, priority }: INodeFilter): void =>
  store.dispatch.wpHooks.addNodeFilter({ name, filter, priority })
