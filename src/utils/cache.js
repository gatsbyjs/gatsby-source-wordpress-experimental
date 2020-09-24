import manager from "cache-manager"
import fs from "fs-extra"
import fsStore from "cache-manager-fs-hash"
import path from "path"

const MAX_CACHE_SIZE = 250
const TTL = Number.MAX_SAFE_INTEGER

export default class Cache {
  constructor({
    name = `db`,
    store = fsStore,
    cacheDirectory = `.wordpress-cache/caches`,
  } = {}) {
    this.name = name
    this.store = store
    this.cacheDirectory = cacheDirectory
  }

  get directory() {
    return path.join(process.cwd(), `${this.cacheDirectory}/${this.name}`)
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

export const getCache = (name) => {
  let cache = caches.get(name)
  if (!cache) {
    cache = new Cache({ name }).init()
    caches.set(name, cache)
  }
  return cache
}
