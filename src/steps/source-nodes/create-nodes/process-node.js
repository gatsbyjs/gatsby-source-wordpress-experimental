import stringify from "fast-json-stable-stringify"
import execall from "execall"
import cheerio from "cheerio"
import fetchReferencedMediaItemsAndCreateNodes from "../fetch-nodes/fetch-referenced-media-items"

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

  await fetchReferencedMediaItemsAndCreateNodes({
    mediaItemUrls,
  })
  // fetch them
  // return media item nodes
}

const getCheerioImgFromMatch = ({ match }) => {
  const parsedMatch = JSON.parse(`"${match}"`)

  const $ = cheerio.load(parsedMatch, {
    xml: {
      withDomLvl1: false,
      normalizeWhitespace: false,
      xmlMode: true,
      decodeEntities: false,
    },
  })

  const cheerioImg = $(`img`)[0]

  return {
    match,
    cheerioImg,
  }
}

const replaceNodeHtmlImages = async ({ nodeString, pluginOptions }) => {
  const imageUrlMatches = execall(imgSrcRemoteFileRegex, nodeString)
  const imgTagMatches = execall(imgTagRegex, nodeString)

  if (imageUrlMatches.length) {
    clipboardy.writeSync(nodeString)
    dd(nodeString)
    const cheerioImages = imgTagMatches.map(getCheerioImgFromMatch)

    const mediaItemNodes = await fetchNodeHtmlImageMediaItemNodes({
      cheerioImages,
    })

    clipboardy.writeSync(JSON.stringify(mediaItemNodes, null, 2))
    dd(mediaItemNodes)

    // generate gatsby images for each cheerioImage

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
