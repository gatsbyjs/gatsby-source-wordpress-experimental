"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.restoreHardCachedNodes = exports.getPersistentCache = exports.setPersistentCache = exports.clearHardCachedNodes = exports.clearHardCache = exports.setHardCachedNodes = exports.restoreStaticDirectory = exports.getHardCachedNodes = exports.getHardCachedData = exports.setHardCachedData = exports.shouldHardCacheData = exports.getCacheInstance = exports.default = void 0;

var _cacheManager = _interopRequireDefault(require("cache-manager"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _cacheManagerFsHash = _interopRequireDefault(require("cache-manager-fs-hash"));

var _path = _interopRequireDefault(require("path"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _store = _interopRequireDefault(require("../store"));

var _getGatsbyApi = require("./get-gatsby-api");

var _fetchGraphql = _interopRequireDefault(require("./fetch-graphql"));

var _helpers = require("../steps/create-schema-customization/helpers");

var _fetchReferencedMediaItems = require("../steps/source-nodes/fetch-nodes/fetch-referenced-media-items");

const MAX_CACHE_SIZE = 250;
const TTL = Number.MAX_SAFE_INTEGER;
const cacheDir = `.wordpress-cache/caches`;

class Cache {
  constructor({
    name = `db`,
    store = _cacheManagerFsHash.default
  } = {}) {
    this.name = name;
    this.store = store;
    this.cacheDirectory = cacheDir;
  }

  get cacheBase() {
    return _path.default.join(process.cwd(), this.cacheDirectory);
  }

  get directory() {
    return `${this.cacheBase}/${this.name}`;
  }

  init() {
    _fsExtra.default.ensureDirSync(this.directory);

    const configs = [{
      store: `memory`,
      max: MAX_CACHE_SIZE,
      ttl: TTL
    }, {
      store: this.store,
      ttl: TTL,
      options: {
        path: this.directory,
        ttl: TTL
      }
    }];
    const caches = configs.map(cache => _cacheManager.default.caching(cache));
    this.cache = _cacheManager.default.multiCaching(caches);
    return this;
  }

  get(key) {
    return new Promise(resolve => {
      if (!this.cache) {
        throw new Error(`Cache wasn't initialised yet, please run the init method first`);
      }

      this.cache.get(key, (err, res) => {
        resolve(err ? undefined : res);
      });
    });
  }

  set(key, value, args = {
    ttl: TTL
  }) {
    return new Promise(resolve => {
      if (!this.cache) {
        throw new Error(`Cache wasn't initialised yet, please run the init method first`);
      }

      this.cache.set(key, value, args, err => {
        resolve(err ? undefined : value);
      });
    });
  }

}

exports.default = Cache;
const caches = new Map();

const getCacheInstance = name => {
  let cache = caches.get(name);

  if (!cache) {
    cache = new Cache({
      name
    }).init();
    caches.set(name, cache);
  }

  return cache;
};

exports.getCacheInstance = getCacheInstance;

const shouldHardCacheData = () => {
  const isDevelop = process.env.NODE_ENV === `development`;

  if (!isDevelop) {
    return false;
  }

  const {
    pluginOptions: {
      develop: {
        hardCacheData
      }
    }
  } = _store.default.getState().gatsbyApi;

  return hardCacheData;
};

exports.shouldHardCacheData = shouldHardCacheData;

const setHardCachedData = async ({
  key,
  value
}) => {
  if (!shouldHardCacheData()) {
    return;
  }

  const hardCache = getCacheInstance(`wordpress-data`);
  await hardCache.set(key, value);
};

exports.setHardCachedData = setHardCachedData;

const getHardCachedData = async ({
  key
}) => {
  if (!shouldHardCacheData()) {
    return null;
  }

  const hardCache = getCacheInstance(`wordpress-data`);
  const data = await hardCache.get(key);
  return data;
};

exports.getHardCachedData = getHardCachedData;

const getHardCachedNodes = async () => {
  const allWpNodes = await getHardCachedData({
    key: `allWpNodes`
  });
  const shouldUseHardDataCache = allWpNodes === null || allWpNodes === void 0 ? void 0 : allWpNodes.length;

  if (shouldUseHardDataCache) {
    return allWpNodes;
  }

  return null;
};

exports.getHardCachedNodes = getHardCachedNodes;
const staticFileCacheDirectory = `${process.cwd()}/.wordpress-cache/caches/public/static`;
const staticFileDirectory = `${process.cwd()}/public/static`;

const restoreStaticDirectory = async () => {
  await _fsExtra.default.copy(staticFileCacheDirectory, staticFileDirectory);
};

exports.restoreStaticDirectory = restoreStaticDirectory;

const copyStaticDirectory = async () => {
  await _fsExtra.default.copy(staticFileDirectory, staticFileCacheDirectory);
};

const setHardCachedNodes = async ({
  helpers
}) => {
  if (!shouldHardCacheData()) {
    return;
  }

  const allNodes = await helpers.getNodes();
  const allWpNodes = allNodes.filter(node => node.internal.owner === `gatsby-source-wordpress-experimental`);
  await setHardCachedData({
    key: `allWpNodes`,
    value: allWpNodes
  }); // if we're hard caching data,
  // that means any inline html images paths will be baked into
  // the processed hard cached nodes.
  // so we need to copy the static directory

  await copyStaticDirectory();
};

exports.setHardCachedNodes = setHardCachedNodes;

const clearHardCache = async () => {
  await new Promise(resolve => {
    const directory = new Cache().cacheBase;
    (0, _rimraf.default)(directory, resolve);
  });
};

exports.clearHardCache = clearHardCache;

const clearHardCachedNodes = async () => {
  const hardCachedNodes = !!(await getHardCachedNodes());

  if (hardCachedNodes) {
    await setHardCachedData({
      key: `allWpNodes`,
      value: null
    });
  }
}; // persistant cache


exports.clearHardCachedNodes = clearHardCachedNodes;

const setPersistentCache = async ({
  key,
  value
}) => {
  const {
    helpers
  } = (0, _getGatsbyApi.getGatsbyApi)();
  await Promise.all([// set Gatsby cache
  helpers.cache.set(key, value), // and hard cache
  setHardCachedData({
    key,
    value
  })]);
};

exports.setPersistentCache = setPersistentCache;

const getPersistentCache = async ({
  key
}) => {
  const {
    helpers
  } = (0, _getGatsbyApi.getGatsbyApi)();
  const cachedData = await helpers.cache.get(key);

  if (cachedData) {
    return cachedData;
  }

  const hardCachedData = await getHardCachedData({
    key
  });
  return hardCachedData;
};

exports.getPersistentCache = getPersistentCache;

const restoreHardCachedNodes = async ({
  hardCachedNodes
}) => {
  const loggerTypeCounts = {};
  const {
    helpers,
    pluginOptions
  } = (0, _getGatsbyApi.getGatsbyApi)();
  const {
    reporter
  } = helpers; // restore nodes

  await Promise.all(hardCachedNodes.map(async node => {
    var _typeSettingsCache$no;

    if (!loggerTypeCounts[node.internal.type]) {
      loggerTypeCounts[node.internal.type] = 0;
    }

    loggerTypeCounts[node.internal.type] += 1; // media items are created in a special way

    if (node.internal.type.endsWith(`MediaItem`)) {
      delete node.internal;
      const {
        createContentDigest,
        actions
      } = helpers;
      return (0, _fetchReferencedMediaItems.createMediaItemNode)({
        node,
        helpers,
        createContentDigest,
        actions,
        parentName: `Hard cache restoration` // referencedMediaItemNodeIds,
        // allMediaItemNodes = [],

      });
    }

    node.internal = {
      contentDigest: node.internal.contentDigest,
      type: node.internal.type
    }; // const createdNodeIds = []
    // const referencedMediaItemNodeIds = new Set()

    const typeSettingsCache = {};
    const typeSettings = (_typeSettingsCache$no = typeSettingsCache[node.type]) !== null && _typeSettingsCache$no !== void 0 ? _typeSettingsCache$no : (0, _helpers.getTypeSettingsByType)({
      name: node.type
    });
    let remoteNode = node;

    if (typeSettings.beforeChangeNode && typeof typeSettings.beforeChangeNode === `function`) {
      const {
        // additionalNodeIds: receivedAdditionalNodeIds,
        remoteNode: receivedRemoteNode // cancelUpdate: receivedCancelUpdate,

      } = (await typeSettings.beforeChangeNode({
        actionType: `CREATE_ALL`,
        remoteNode,
        actions: helpers.actions,
        helpers,
        fetchGraphql: _fetchGraphql.default,
        typeSettings,
        buildTypeName: _helpers.buildTypeName,
        type: node.type,
        wpStore: _store.default
      })) || {};

      if (receivedRemoteNode) {
        remoteNode = receivedRemoteNode;
      }
    } // restore each node


    await helpers.actions.createNode(remoteNode);
  }));
  Object.entries(loggerTypeCounts).forEach(([typeName, count]) => {
    _store.default.dispatch.logger.createActivityTimer({
      typeName,
      pluginOptions,
      reporter
    });

    _store.default.dispatch.logger.incrementActivityTimer({
      typeName,
      by: count,
      action: `restored`
    });

    _store.default.dispatch.logger.stopActivityTimer({
      typeName,
      action: `restored`
    });
  }); // restore static directory

  await restoreStaticDirectory(); // build createdNodeIds id array to be cached 1 level above

  const createdNodeIds = hardCachedNodes.map(node => node.id);
  return createdNodeIds;
};

exports.restoreHardCachedNodes = restoreHardCachedNodes;