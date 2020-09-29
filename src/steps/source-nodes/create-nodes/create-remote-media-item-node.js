import fs from "fs-extra"
import path from "path"
import url from "url"

import retry from "async-retry"

import { createFileNodeFromBuffer } from "gatsby-source-filesystem"

import createRemoteFileNode from "./create-remote-file-node/index"

import store from "~/store"

import urlToPath from "~/utils/url-to-path"
import { formatLogMessage } from "~/utils/format-log-message"
import { stripImageSizesFromUrl } from "~/steps/source-nodes/fetch-nodes/fetch-referenced-media-items"
import { ensureSrcHasHostname } from "./process-node"

export const getFileNodeMetaBySourceUrl = (sourceUrl) => {
  const fileNodesMetaByUrls = store.getState().imageNodes.nodeMetaByUrl

  return fileNodesMetaByUrls[stripImageSizesFromUrl(sourceUrl)]
}

export const getMediaItemEditLink = (node) => {
  const { protocol, hostname } = url.parse(node.link)
  const editUrl = `${protocol}//${hostname}/wp-admin/upload.php?item=${node.databaseId}`

  return editUrl
}

export const errorPanicker = ({ error, reporter, node }) => {
  if (
    error.includes(`Response code 4`) ||
    error.includes(`Response code 500`) ||
    error.includes(`Response code 511`) ||
    error.includes(`Response code 508`) ||
    error.includes(`Response code 505`) ||
    error.includes(`Response code 501`)
  ) {
    const editUrl = getMediaItemEditLink(node)

    reporter.log(``)
    reporter.info(
      formatLogMessage(
        `Unrecoverable error occured while fetching media item #${node.databaseId}\n\nMedia item link: ${node.link}\nEdit link: ${editUrl}\nFile url: ${node.mediaItemUrl}`
      )
    )
    reporter.panic(error)
  }
}

export const getFileNodeByMediaItemNode = async ({
  mediaItemNode,
  helpers,
}) => {
  const { sourceUrl, modifiedGmt, mediaItemUrl, databaseId } = mediaItemNode

  const fileUrl = sourceUrl || mediaItemUrl

  if (!fileUrl) {
    helpers.reporter.warn(
      formatLogMessage(`Couldn't find source url for media item #${databaseId}`)
    )
    return null
  }

  const existingNodeMeta = getFileNodeMetaBySourceUrl(fileUrl)

  if (
    // if we already have this image
    existingNodeMeta &&
    existingNodeMeta.id &&
    // and it hasn't been modified
    existingNodeMeta.modifiedGmt === modifiedGmt
  ) {
    let node = await helpers.getNode(existingNodeMeta.id)

    // some of the cached node metas dont necessarily need to be a File
    // so make sure we return a File node if what we get isn't one
    if (node && node.internal && node.internal.type !== `File`) {
      if (node.localFile && node.localFile.id) {
        // look up the corresponding file node
        node = await helpers.getNode(node.localFile.id)
      } else {
        return null
      }
    }

    return node
  }

  return null
}

export const createRemoteMediaItemNode = async ({
  mediaItemNode,
  fixedBarTotal,
}) => {
  const state = store.getState()
  const { helpers, pluginOptions } = state.gatsbyApi

  const existingNode = await getFileNodeByMediaItemNode({
    mediaItemNode,
    helpers,
  })

  if (existingNode) {
    return existingNode
  }

  const {
    store: gatsbyStore,
    cache,
    createNodeId,
    reporter,
    actions: { createNode },
  } = helpers

  let { mediaItemUrl, modifiedGmt, mimeType, title } = mediaItemNode

  if (!mediaItemUrl) {
    return null
  }

  const { wpUrl } = state.remoteSchema
  mediaItemUrl = ensureSrcHasHostname({ wpUrl, src: mediaItemUrl })

  const { excludeByMimeTypes } = pluginOptions.type?.MediaItem?.localFile

  // if this type of file is excluded, don't fetch the remote file
  if (excludeByMimeTypes.includes(mimeType)) {
    return null
  }

  const hardCachedFileRelativePath = urlToPath(mediaItemUrl)
  const hardCachedMediaFilesDirectory = `${process.cwd()}/.wordpress-cache`

  const hardCachedFilePath =
    hardCachedMediaFilesDirectory + hardCachedFileRelativePath

  const hardCacheMediaFiles =
    (process.env.NODE_ENV === `development` &&
      pluginOptions.develop.hardCacheMediaFiles) ||
    (process.env.NODE_ENV === `production` &&
      pluginOptions.production.hardCacheMediaFiles)

  // Otherwise we need to download it
  const remoteFileNode = await retry(
    async () => {
      const createFileNodeRequirements = {
        parentNodeId: mediaItemNode.id,
        store: gatsbyStore,
        cache,
        createNode,
        createNodeId,
        reporter,
      }

      if (hardCacheMediaFiles) {
        // check for file in .wordpress-cache/wp-content
        // if it exists, use that to create a node from instead of
        // fetching from wp
        try {
          const buffer = await fs.readFile(hardCachedFilePath)
          const node = await createFileNodeFromBuffer({
            buffer,
            name: title,
            ext: path.extname(mediaItemUrl),
            ...createFileNodeRequirements,
          })

          if (node) {
            return node
          }
        } catch (e) {
          // ignore errors, we'll download the image below if it doesn't exist
        }
      }

      const { hostname: wpUrlHostname } = url.parse(wpUrl)
      const { hostname: mediaItemHostname } = url.parse(mediaItemUrl)

      const htaccessCredentials = pluginOptions.auth.htaccess

      // if media items are hosted on another url like s3,
      // using the htaccess creds will throw 400 errors
      const shouldUseHtaccessCredentials = wpUrlHostname === mediaItemHostname

      const auth =
        htaccessCredentials && shouldUseHtaccessCredentials
          ? {
              htaccess_pass: htaccessCredentials?.password,
              htaccess_user: htaccessCredentials?.username,
            }
          : null

      // if this errors, it's caught one level above in fetch-referenced-media-items.js so it can be placed on the end of the request queue
      const node = await createRemoteFileNode({
        url: mediaItemUrl,
        fixedBarTotal,
        auth,
        ...createFileNodeRequirements,
      })

      return node
    },
    {
      retries: 3,
      factor: 1.1,
      minTimeout: 5000,
      onRetry: (error) =>
        errorPanicker({ error, reporter, node: mediaItemNode }),
    }
  )

  // push it's id and url to our store for caching,
  // so we can touch this node next time
  // and so we can easily access the id by source url later
  store.dispatch.imageNodes.pushNodeMeta({
    id: remoteFileNode.id,
    sourceUrl: mediaItemUrl,
    modifiedGmt,
  })

  if (hardCacheMediaFiles) {
    try {
      // make sure the directory exists
      await fs.ensureDir(path.dirname(hardCachedFilePath))
      // copy our downloaded file to our existing directory
      await fs.copyFile(remoteFileNode.absolutePath, hardCachedFilePath)
    } catch (e) {
      helpers.reporter.panic(e)
    }
  }

  // and use it
  return remoteFileNode
}
