"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createRemoteMediaItemNode = exports.getFileNodeByMediaItemNode = exports.errorPanicker = exports.getMediaItemEditLink = exports.getFileNodeMetaBySourceUrl = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _url = _interopRequireDefault(require("url"));

var _asyncRetry = _interopRequireDefault(require("async-retry"));

var _gatsbySourceFilesystem = require("gatsby-source-filesystem");

var _index = _interopRequireDefault(require("./create-remote-file-node/index"));

var _store = _interopRequireDefault(require("../../../store"));

var _urlToPath = _interopRequireDefault(require("../../../utils/url-to-path"));

var _formatLogMessage = require("../../../utils/format-log-message");

var _fetchReferencedMediaItems = require("../fetch-nodes/fetch-referenced-media-items");

var _processNode = require("./process-node");

const getFileNodeMetaBySourceUrl = sourceUrl => {
  const fileNodesMetaByUrls = _store.default.getState().imageNodes.nodeMetaByUrl;

  return fileNodesMetaByUrls[(0, _fetchReferencedMediaItems.stripImageSizesFromUrl)(sourceUrl)];
};

exports.getFileNodeMetaBySourceUrl = getFileNodeMetaBySourceUrl;

const getMediaItemEditLink = node => {
  const {
    protocol,
    hostname
  } = _url.default.parse(node.link);

  const editUrl = `${protocol}//${hostname}/wp-admin/upload.php?item=${node.databaseId}`;
  return editUrl;
};

exports.getMediaItemEditLink = getMediaItemEditLink;

const errorPanicker = ({
  error,
  reporter,
  node,
  fetchState,
  parentName
}) => {
  const editUrl = getMediaItemEditLink(node);
  const sharedError = `occured while fetching media item #${node.databaseId}${parentName ? ` in step:\n\n"${parentName}"` : ``}\n\nMedia item link: ${node.link}\nEdit link: ${editUrl}\nFile url: ${node.mediaItemUrl}`;

  if (process.env.NODE_ENV !== `production` && error.includes(`Response code 404`)) {
    fetchState.shouldBail = true;
    reporter.log(``);
    reporter.warn((0, _formatLogMessage.formatLogMessage)(`Error ${sharedError}\n\nThis error will fail production builds.`));
    reporter.log(``);
    return;
  }

  if (error.includes(`Response code 4`) || error.includes(`Response code 500`) || error.includes(`Response code 511`) || error.includes(`Response code 508`) || error.includes(`Response code 505`) || error.includes(`Response code 501`)) {
    reporter.log(``);
    reporter.info((0, _formatLogMessage.formatLogMessage)(`Unrecoverable error ${sharedError}\n\nFailing the build to prevent deploying a broken site.`));
    reporter.panic(error);
  }
};

exports.errorPanicker = errorPanicker;

const getFileNodeByMediaItemNode = async ({
  mediaItemNode,
  helpers
}) => {
  const {
    sourceUrl,
    modifiedGmt,
    mediaItemUrl,
    databaseId
  } = mediaItemNode;
  const fileUrl = sourceUrl || mediaItemUrl;

  if (!fileUrl) {
    helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`Couldn't find source url for media item #${databaseId}`));
    return null;
  }

  const existingNodeMeta = getFileNodeMetaBySourceUrl(fileUrl);

  if ( // if we already have this image
  existingNodeMeta && existingNodeMeta.id && // and it hasn't been modified
  existingNodeMeta.modifiedGmt === modifiedGmt) {
    let node = await helpers.getNode(existingNodeMeta.id); // some of the cached node metas dont necessarily need to be a File
    // so make sure we return a File node if what we get isn't one

    if (node && node.internal && node.internal.type !== `File`) {
      if (node.localFile && node.localFile.id) {
        // look up the corresponding file node
        node = await helpers.getNode(node.localFile.id);
      } else {
        return null;
      }
    }

    return node;
  }

  return null;
};

exports.getFileNodeByMediaItemNode = getFileNodeByMediaItemNode;

const createRemoteMediaItemNode = async ({
  mediaItemNode,
  parentName
}) => {
  var _pluginOptions$type, _pluginOptions$type$M;

  const state = _store.default.getState();

  const {
    helpers,
    pluginOptions
  } = state.gatsbyApi;
  const existingNode = await getFileNodeByMediaItemNode({
    mediaItemNode,
    helpers
  });

  if (existingNode) {
    return existingNode;
  }

  const {
    store: gatsbyStore,
    cache,
    createNodeId,
    reporter,
    actions: {
      createNode
    }
  } = helpers;
  let {
    mediaItemUrl,
    modifiedGmt,
    mimeType,
    title
  } = mediaItemNode;

  if (!mediaItemUrl) {
    return null;
  }

  const {
    wpUrl
  } = state.remoteSchema;
  mediaItemUrl = (0, _processNode.ensureSrcHasHostname)({
    wpUrl,
    src: mediaItemUrl
  });
  const {
    excludeByMimeTypes
  } = (_pluginOptions$type = pluginOptions.type) === null || _pluginOptions$type === void 0 ? void 0 : (_pluginOptions$type$M = _pluginOptions$type.MediaItem) === null || _pluginOptions$type$M === void 0 ? void 0 : _pluginOptions$type$M.localFile; // if this type of file is excluded, don't fetch the remote file

  if (excludeByMimeTypes.includes(mimeType)) {
    return null;
  }

  const hardCachedFileRelativePath = (0, _urlToPath.default)(mediaItemUrl);
  const hardCachedMediaFilesDirectory = `${process.cwd()}/.wordpress-cache`;
  const hardCachedFilePath = hardCachedMediaFilesDirectory + hardCachedFileRelativePath;
  const hardCacheMediaFiles = process.env.NODE_ENV === `development` && pluginOptions.develop.hardCacheMediaFiles || process.env.NODE_ENV === `production` && pluginOptions.production.hardCacheMediaFiles;
  let fetchState = {
    shouldBail: false
  }; // Otherwise we need to download it

  const remoteFileNode = await (0, _asyncRetry.default)(async () => {
    if (fetchState.shouldBail) {
      return null;
    }

    const createFileNodeRequirements = {
      parentNodeId: mediaItemNode.id,
      store: gatsbyStore,
      cache,
      createNode,
      createNodeId,
      reporter
    };

    if (hardCacheMediaFiles) {
      // check for file in .wordpress-cache/wp-content
      // if it exists, use that to create a node from instead of
      // fetching from wp
      try {
        const buffer = await _fsExtra.default.readFile(hardCachedFilePath);
        const node = await (0, _gatsbySourceFilesystem.createFileNodeFromBuffer)(Object.assign({
          buffer,
          name: title,
          ext: _path.default.extname(mediaItemUrl)
        }, createFileNodeRequirements));

        if (node) {
          return node;
        }
      } catch (e) {// ignore errors, we'll download the image below if it doesn't exist
      }
    }

    const {
      hostname: wpUrlHostname
    } = _url.default.parse(wpUrl);

    const {
      hostname: mediaItemHostname
    } = _url.default.parse(mediaItemUrl);

    const htaccessCredentials = pluginOptions.auth.htaccess; // if media items are hosted on another url like s3,
    // using the htaccess creds will throw 400 errors

    const shouldUseHtaccessCredentials = wpUrlHostname === mediaItemHostname;
    const auth = htaccessCredentials && shouldUseHtaccessCredentials ? {
      htaccess_pass: htaccessCredentials === null || htaccessCredentials === void 0 ? void 0 : htaccessCredentials.password,
      htaccess_user: htaccessCredentials === null || htaccessCredentials === void 0 ? void 0 : htaccessCredentials.username
    } : null; // if this errors, it's caught one level above in fetch-referenced-media-items.js so it can be placed on the end of the request queue

    const node = await (0, _index.default)(Object.assign({
      url: mediaItemUrl,
      auth
    }, createFileNodeRequirements));
    return node;
  }, {
    retries: 3,
    factor: 1.1,
    minTimeout: 5000,
    onRetry: error => errorPanicker({
      error,
      reporter,
      node: mediaItemNode,
      fetchState,
      parentName
    })
  });

  if (!remoteFileNode) {
    return null;
  } // push it's id and url to our store for caching,
  // so we can touch this node next time
  // and so we can easily access the id by source url later


  _store.default.dispatch.imageNodes.pushNodeMeta({
    id: remoteFileNode.id,
    sourceUrl: mediaItemUrl,
    modifiedGmt
  });

  if (hardCacheMediaFiles) {
    try {
      // make sure the directory exists
      await _fsExtra.default.ensureDir(_path.default.dirname(hardCachedFilePath)); // copy our downloaded file to our existing directory

      await _fsExtra.default.copyFile(remoteFileNode.absolutePath, hardCachedFilePath);
    } catch (e) {
      helpers.reporter.panic(e);
    }
  } // and use it


  return remoteFileNode;
};

exports.createRemoteMediaItemNode = createRemoteMediaItemNode;