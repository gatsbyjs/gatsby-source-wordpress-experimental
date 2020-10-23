import manager from "cache-manager"
import fs from "fs-extra"
import fsStore from "cache-manager-fs-hash"
import path from "path"
import rimraf from "rimraf"

import store from "~/store"
import { getGatsbyApi } from "~/utils/get-gatsby-api"

import fetchGraphql from "~/utils/fetch-graphql"

import {
  getTypeSettingsByType,
  buildTypeName,
} from "~/steps/create-schema-customization/helpers"

import { createMediaItemNode } from "~/steps/source-nodes/fetch-nodes/fetch-referenced-media-items"

const MAX_CACHE_SIZE = 250
const TTL = Number.MAX_SAFE_INTEGER
const cacheDir = `.wordpress-cache/caches`

export default class Cache {
  constructor({ name = `db`, store = fsStore } = {}) {
    this.name = name
    this.store = store
    this.cacheDirectory = cacheDir
  }

  get cacheBase() {
    return path.join(process.cwd(), this.cacheDirectory)
  }

  get directory() {
    return `${this.cacheBase}/${this.name}`
  }

  init() {
    fs.ensureDirSync(this.directory)

    const configs = [
      {
        store: `memory`,
        max: MAX_CACHE_SIZE,
        ttl: TTL,
      },
      {
        store: this.store,
        ttl: TTL,
        options: {
          path: this.directory,
          ttl: TTL,
        },
      },
    ]

    const caches = configs.map((cache) => manager.caching(cache))

    this.cache = manager.multiCaching(caches)

    return this
  }

  get(key) {
    return new Promise((resolve) => {
      if (!this.cache) {
        throw new Error(
          `Cache wasn't initialised yet, please run the init method first`
        )
      }
      this.cache.get(key, (err, res) => {
        resolve(err ? undefined : res)
      })
    })
  }

  set(key, value, args = { ttl: TTL }) {
    return new Promise((resolve) => {
      if (!this.cache) {
        throw new Error(
          `Cache wasn't initialised yet, please run the init method first`
        )
      }
      this.cache.set(key, value, args, (err) => {
        resolve(err ? undefined : value)
      })
    })
  }
}

const caches = new Map()

export const getCacheInstance = (name) => {
  let cache = caches.get(name)
  if (!cache) {
    cache = new Cache({ name }).init()
    caches.set(name, cache)
  }
  return cache
}

export const shouldHardCacheData = () => {
  const isDevelop = process.env.NODE_ENV === `development`

  if (!isDevelop) {
    return false
  }

  const {
    pluginOptions: {
      develop: { hardCacheData },
    },
  } = store.getState().gatsbyApi

  return hardCacheData
}

export const setHardCachedData = async ({ key, value }) => {
  if (!shouldHardCacheData()) {
    return
  }

  const hardCache = getCacheInstance(`wordpress-data`)

  await hardCache.set(key, value)
}

export const getHardCachedData = async ({ key }) => {
  if (!shouldHardCacheData()) {
    return null
  }

  const hardCache = getCacheInstance(`wordpress-data`)

  const data = await hardCache.get(key)

  return data
}

export const getHardCachedNodes = async () => {
  const allWpNodes = await getHardCachedData({ key: `allWpNodes` })

  const shouldUseHardDataCache = allWpNodes?.length

  if (shouldUseHardDataCache) {
    return allWpNodes
  }

  return null
}

const staticFileCacheDirectory = `${process.cwd()}/.wordpress-cache/caches/public/static`
const staticFileDirectory = `${process.cwd()}/public/static`

export const restoreStaticDirectory = async () => {
  await fs.copy(staticFileCacheDirectory, staticFileDirectory)
}

const copyStaticDirectory = async () => {
  await fs.copy(staticFileDirectory, staticFileCacheDirectory)
}

export const setHardCachedNodes = async ({ helpers }) => {
  if (!shouldHardCacheData()) {
    return
  }

  const allNodes = await helpers.getNodes()

  const allWpNodes = allNodes.filter(
    (node) => node.internal.owner === `gatsby-source-wordpress-experimental`
  )

  await setHardCachedData({
    key: `allWpNodes`,
    value: allWpNodes,
  })

  // if we're hard caching data,
  // that means any inline html images paths will be baked into
  // the processed hard cached nodes.
  // so we need to copy the static directory
  await copyStaticDirectory()
}

export const clearHardCache = async () => {
  await new Promise((resolve) => {
    const directory = new Cache().cacheBase

    rimraf(directory, resolve)
  })
}

export const clearHardCachedNodes = async () => {
  const hardCachedNodes = !!(await getHardCachedNodes())

  if (hardCachedNodes) {
    await setHardCachedData({
      key: `allWpNodes`,
      value: null,
    })
  }
}

// persistant cache
export const setPersistentCache = async ({ key, value }) => {
  const { helpers } = getGatsbyApi()

  await Promise.all([
    // set Gatsby cache
    helpers.cache.set(key, value),
    // and hard cache
    setHardCachedData({ key, value }),
  ])
}

export const getPersistentCache = async ({ key }) => {
  const { helpers } = getGatsbyApi()

  const cachedData = await helpers.cache.get(key)

  if (cachedData) {
    return cachedData
  }

  const hardCachedData = await getHardCachedData({ key })

  return hardCachedData
}

export const restoreHardCachedNodes = async ({ hardCachedNodes }) => {
  const loggerTypeCounts = {}

  const { helpers, pluginOptions } = getGatsbyApi()
  const { reporter } = helpers

  // restore nodes
  await Promise.all(
    hardCachedNodes.map(async (node) => {
      if (!loggerTypeCounts[node.internal.type]) {
        loggerTypeCounts[node.internal.type] = 0
      }

      loggerTypeCounts[node.internal.type] += 1

      // media items are created in a special way
      if (node.internal.type.endsWith(`MediaItem`)) {
        delete node.internal

        const { createContentDigest, actions } = helpers

        return createMediaItemNode({
          node,
          helpers,
          createContentDigest,
          actions,
          parentName: `Hard cache restoration`,
          // referencedMediaItemNodeIds,
          // allMediaItemNodes = [],
        })
      }

      node.internal = {
        contentDigest: node.internal.contentDigest,
        type: node.internal.type,
      }

      // const createdNodeIds = []
      // const referencedMediaItemNodeIds = new Set()

      const typeSettingsCache = {}

      const typeSettings =
        typeSettingsCache[node.type] ??
        getTypeSettingsByType({
          name: node.type,
        })

      let remoteNode = node

      if (
        typeSettings.beforeChangeNode &&
        typeof typeSettings.beforeChangeNode === `function`
      ) {
        const {
          // additionalNodeIds: receivedAdditionalNodeIds,
          remoteNode: receivedRemoteNode,
          // cancelUpdate: receivedCancelUpdate,
        } =
          (await typeSettings.beforeChangeNode({
            actionType: `CREATE_ALL`,
            remoteNode,
            actions: helpers.actions,
            helpers,
            fetchGraphql,
            typeSettings,
            buildTypeName,
            type: node.type,
            wpStore: store,
          })) || {}

        if (receivedRemoteNode) {
          remoteNode = receivedRemoteNode
        }
      }

      // restore each node
      await helpers.actions.createNode(remoteNode)
    })
  )

  Object.entries(loggerTypeCounts).forEach(([typeName, count]) => {
    store.dispatch.logger.createActivityTimer({
      typeName,
      pluginOptions,
      reporter,
    })

    store.dispatch.logger.incrementActivityTimer({
      typeName,
      by: count,
      action: `restored`,
    })

    store.dispatch.logger.stopActivityTimer({ typeName, action: `restored` })
  })

  // restore static directory
  await restoreStaticDirectory()

  // build createdNodeIds id array to be cached 1 level above
  const createdNodeIds = hardCachedNodes.map((node) => node.id)

  return createdNodeIds
}
