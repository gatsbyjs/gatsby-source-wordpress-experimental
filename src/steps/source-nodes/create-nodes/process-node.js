import { queueImageResizing, setBoundActionCreators } from "gatsby-plugin-sharp"
import Img from "gatsby-image"
import React from "react"

import stringify from "fast-json-stable-stringify"
import execall from "execall"
import cheerio from "cheerio"
import fetchReferencedMediaItemsAndCreateNodes, {
  stripImageSizesFromUrl,
} from "../fetch-nodes/fetch-referenced-media-items"
import store from "~/store"

const imgSrcRemoteFileRegex = /(?:src=\\")((?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])\.(?:jpeg|jpg|png|gif|ico|pdf|doc|docx|ppt|pptx|pps|ppsx|odt|xls|psd|mp3|m4a|ogg|wav|mp4|m4v|mov|wmv|avi|mpg|ogv|3gp|3g2|svg|bmp|tif|tiff|asf|asx|wm|wmx|divx|flv|qt|mpe|webm|mkv|txt|asc|c|cc|h|csv|tsv|ics|rtx|css|htm|html|m4b|ra|ram|mid|midi|wax|mka|rtf|js|swf|class|tar|zip|gz|gzip|rar|7z|exe|pot|wri|xla|xlt|xlw|mdb|mpp|docm|dotx|dotm|xlsm|xlsb|xltx|xltm|xlam|pptm|ppsm|potx|potm|ppam|sldx|sldm|onetoc|onetoc2|onetmp|onepkg|odp|ods|odg|odc|odb|odf|wp|wpd|key|numbers|pages))(?=\\"| |\.)/gim

const imgTagRegex = /<img([\w\W]+?)[\/]?>/gim

const findReferencedImageNodeIds = ({
  nodeString,
  pluginOptions,
  referencedMediaItemNodeIds,
  node,
}) => {
  // if the lazyNodes plugin option is set we don't need to find
  // image node id's because those nodes will be fetched lazily in resolvers
  if (pluginOptions.type.MediaItem.lazyNodes) {
    return
  }

  // get an array of all referenced media file ID's
  const matchedIds = execall(/"id":"([^"]*)","sourceUrl"/gm, nodeString)
    .map((match) => match.subMatches[0])
    .filter((id) => id !== node.id)

  return matchedIds
}

const fetchNodeHtmlImageMediaItemNodes = async ({ cheerioImages }) => {
  // check if we have any of these nodes locally already
  // build a query to fetch all media items that we don't already have
  const mediaItemUrls = cheerioImages.map(
    ({ cheerioImg }) => cheerioImg.attribs.src
  )

  const mediaItemNodes = await fetchReferencedMediaItemsAndCreateNodes({
    mediaItemUrls,
  })

  const htmlMatchesToMediaItemNodesMap = mediaItemNodes.reduce(
    (accumulator, mediaItemNode) => {
      const { match } =
        cheerioImages.find(({ cheerioImg }) =>
          [
            // try to match the media item source url by original html src
            cheerioImg.attribs.src,
            // or by the src minus any image sizes string
            stripImageSizesFromUrl(cheerioImg.attribs.src),
          ].includes(mediaItemNode.sourceUrl)
        ) || {}

      if (!match) {
        dump(`no html image found for node:`)
        dd(mediaItemNode)
      }

      // match is the html string of the img tag
      accumulator.set(match, mediaItemNode)

      return accumulator
    },
    new Map()
  )

  return htmlMatchesToMediaItemNodesMap
}

const getCheerioImgFromMatch = ({ match }) => {
  // unescape quotes
  const parsedMatch = JSON.parse(`"${match}"`)

  // load our matching img tag into cheerio
  const $ = cheerio.load(parsedMatch, {
    xml: {
      // make sure it's not wrapped in <body></body>
      withDomLvl1: false,
      // no need to normalize whitespace, we're dealing with a single element here
      normalizeWhitespace: false,
      xmlMode: true,
      // entity decoding isn't our job here, that will be the responsibility of WPGQL
      // or of the source plugin elsewhere.
      decodeEntities: false,
    },
  })

  // there's only ever one image due to our match matching a single img tag
  // $(`img`) isn't an array, it's an object with a key of 0
  const cheerioImg = $(`img`)[0]

  return {
    match,
    cheerioImg,
  }
}

const replaceNodeHtmlImages = async ({
  nodeString,
  pluginOptions,
  helpers,
}) => {
  setBoundActionCreators(helpers.boundActionCreators)
  const imageUrlMatches = execall(imgSrcRemoteFileRegex, nodeString)
  const imgTagMatches = execall(imgTagRegex, nodeString)

  if (imageUrlMatches.length) {
    const cheerioImages = imgTagMatches.map(getCheerioImgFromMatch)

    const htmlMatchesToMediaItemNodesMap = await fetchNodeHtmlImageMediaItemNodes(
      {
        cheerioImages,
      }
    )

    // generate gatsby images for each cheerioImage
    const htmlMatchesToGatsbyImgStringMap = await Promise.all(
      imgTagMatches.map(async ({ match }) => {
        const mediaItemNode = htmlMatchesToMediaItemNodesMap.get(match)
        const fileNode = helpers.getNode(mediaItemNode.remoteFile.id)

        dump(`fluid result coming up`)

        const fluidResult = await queueImageResizing({
          file: fileNode,
          args: {
            maxWidth: 800,
          },
          reporter: helpers.reporter,
          cache: helpers.cache,
        })

        dump(fluidResult)
      })
    )

    // find/replace mutate nodeString to replace matched images with rendered gatsby images

    store.dispatch.imageNodes.addImgMatches(imageUrlMatches)
  }

  return nodeString
}

const processNodeString = async ({ nodeString, pluginOptions, helpers }) => {
  // const nodeStringFilters = [replaceNodeHtmlImages,]
  const nodeStringWithGatsbyImages = replaceNodeHtmlImages({
    nodeString,
    pluginOptions,
    helpers,
  })

  // const mediaItemNodes = await helpers.getNodesByType(`WpMediaItem`)
  // dd(mediaItemNodes)

  // const nodeStringWithGatsbyImagesAndRelativeLinks = replaceNodeHtmlLinks({
  //   nodeString,
  //   pluginOptions,
  // })
  // return nodeStringWithGatsbyImagesAndRelativeLinks

  return nodeStringWithGatsbyImages
}

const processNode = async ({
  node,
  pluginOptions,
  referencedMediaItemNodeIds,
  wpUrl,
  helpers,
}) => {
  const anchorTagRegex = new RegExp(
    // eslint-disable-next-line no-useless-escape
    `<a[\\\s]+[^>]*?href[\\\s]?=["'\\\\]*(${wpUrl}.*?)["'\\\\]*.*?>([^<]+|.*?)?<\/a>`,
    `gim`
  )

  const nodeString = stringify(node)

  // find referenced node ids
  const nodeMediaItemIdReferences = findReferencedImageNodeIds({
    nodeString,
    pluginOptions,
    node,
  })

  // push them to our store of referenced id's
  if (nodeMediaItemIdReferences.length) {
    nodeMediaItemIdReferences.forEach((id) =>
      referencedMediaItemNodeIds.add(id)
    )
  }

  const processedNodeString = await processNodeString({
    nodeString,
    pluginOptions,
    helpers,
  })

  // only parse if the nodeString has changed
  if (processedNodeString !== nodeString) {
    dd(processedNodeString)
    return JSON.parse(processedNodeString)
  } else {
    return node
  }
}

export { processNode }
