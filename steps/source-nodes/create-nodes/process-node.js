"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.processNode = exports.ensureSrcHasHostname = void 0;

var _validUrl = require("valid-url");

var _gatsbyPluginSharp = require("gatsby-plugin-sharp");

var _gatsbyImage = _interopRequireDefault(require("gatsby-image"));

var _react = _interopRequireDefault(require("react"));

var _server = _interopRequireDefault(require("react-dom/server"));

var _fastJsonStableStringify = _interopRequireDefault(require("fast-json-stable-stringify"));

var _execall = _interopRequireDefault(require("execall"));

var _cheerio = _interopRequireDefault(require("cheerio"));

var _url = _interopRequireDefault(require("url"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _supportedExtensions = require("gatsby-transformer-sharp/supported-extensions");

var _replaceall = _interopRequireDefault(require("replaceall"));

var _formatLogMessage = require("../../../utils/format-log-message");

var _index = _interopRequireDefault(require("./create-remote-file-node/index"));

var _fetchReferencedMediaItems = _interopRequireWildcard(require("../fetch-nodes/fetch-referenced-media-items"));

var _btoa = _interopRequireDefault(require("btoa"));

var _store = _interopRequireDefault(require("../../../store"));

const getNodeEditLink = node => {
  const {
    protocol,
    hostname
  } = _url.default.parse(node.link);

  const editUrl = `${protocol}//${hostname}/wp-admin/post.php?post=${node.databaseId}&action=edit`;
  return editUrl;
};

const findReferencedImageNodeIds = ({
  nodeString,
  pluginOptions,
  node
}) => {
  // if the lazyNodes plugin option is set we don't need to find
  // image node id's because those nodes will be fetched lazily in resolvers
  if (pluginOptions.type.MediaItem.lazyNodes) {
    return [];
  } // get an array of all referenced media file ID's


  const matchedIds = (0, _execall.default)(/"__typename":"MediaItem","id":"([^"]*)"/gm, nodeString).map(match => match.subMatches[0]).filter(id => id !== node.id);
  return matchedIds;
};

const getCheerioImgDbId = cheerioImg => {
  // try to get the db id from data attributes
  const dataAttributeId = cheerioImg.attribs[`data-id`] || cheerioImg.attribs[`data-image-id`];

  if (dataAttributeId) {
    return dataAttributeId;
  }

  if (!cheerioImg.attribs.class) {
    return null;
  } // try to get the db id from the wp-image-id classname


  const wpImageClass = cheerioImg.attribs.class.split(` `).find(className => className.includes(`wp-image-`));

  if (wpImageClass) {
    const wpImageClassDashArray = wpImageClass.split(`-`);
    const wpImageClassId = Number(wpImageClassDashArray[wpImageClassDashArray.length - 1]);

    if (wpImageClassId) {
      return wpImageClassId;
    }
  }

  return null;
}; // media items are of the "post" type


const dbIdToMediaItemRelayId = dbId => dbId ? (0, _btoa.default)(`post:${dbId}`) : null;

const getCheerioImgRelayId = cheerioImg => dbIdToMediaItemRelayId(getCheerioImgDbId(cheerioImg));

const ensureSrcHasHostname = ({
  src,
  wpUrl
}) => {
  const {
    protocol,
    host
  } = _url.default.parse(wpUrl);

  if (src.startsWith(`/wp-content`)) {
    src = `${protocol}//${host}${src}`;
  }

  return src;
};

exports.ensureSrcHasHostname = ensureSrcHasHostname;

const pickNodeBySourceUrlOrCheerioImg = ({
  url,
  cheerioImg,
  mediaItemNodes
}) => {
  const possibleHtmlSrcs = [// try to match the media item source url by original html src
  url, // or by the src minus any image sizes string
  (0, _fetchReferencedMediaItems.stripImageSizesFromUrl)(url)];
  let imageNode = mediaItemNodes.find(mediaItemNode => // either find our node by the source url
  possibleHtmlSrcs.includes(mediaItemNode.sourceUrl) || possibleHtmlSrcs.includes( // try to match without -scaled in the sourceUrl as well
  // since WP adds -scaled to image urls if they were too large
  // at upload time but image urls in html don't have this requirement.
  // the sourceUrl may have -scaled in it but the full size image is still
  // stored on the server (just not in the db)
  (mediaItemNode.sourceUrl || mediaItemNode.mediaItemUrl).replace(`-scaled`, ``)) || // or by id for cases where the src url didn't return a node
  !!cheerioImg && getCheerioImgRelayId(cheerioImg) === mediaItemNode.id);
  return imageNode;
};

const fetchNodeHtmlImageMediaItemNodes = async ({
  cheerioImages,
  nodeString,
  node,
  helpers,
  pluginOptions,
  wpUrl
}) => {
  // get all the image nodes we've cached from elsewhere
  const {
    nodeMetaByUrl
  } = _store.default.getState().imageNodes;

  const previouslyCachedNodesByUrl = (await Promise.all(Object.entries(nodeMetaByUrl).map(([sourceUrl, {
    id
  } = {}]) => {
    var _helpers$getNode;

    if (!sourceUrl || !id) {
      return null;
    }

    sourceUrl = ensureSrcHasHostname({
      wpUrl,
      src: sourceUrl
    });
    return Object.assign({
      sourceUrl
    }, (_helpers$getNode = helpers.getNode(id)) !== null && _helpers$getNode !== void 0 ? _helpers$getNode : {});
  }))).filter(Boolean);
  const mediaItemUrls = cheerioImages // filter out nodes we already have
  .filter(({
    cheerioImg
  }) => {
    const url = ensureSrcHasHostname({
      wpUrl,
      src: cheerioImg.attribs.src
    });
    const existingNode = pickNodeBySourceUrlOrCheerioImg({
      url,
      mediaItemNodes: previouslyCachedNodesByUrl
    });
    return !existingNode;
  }) // get remaining urls
  .map(({
    cheerioImg
  }) => {
    let src = ensureSrcHasHostname({
      src: cheerioImg.attribs.src,
      wpUrl
    });
    return src;
  }); // build a query to fetch all media items that we don't already have

  const mediaItemNodesBySourceUrl = await (0, _fetchReferencedMediaItems.default)({
    mediaItemUrls
  }); // images that have been edited from the media library that were previously
  // uploaded to a post/page will have a different sourceUrl so they can't be fetched by it
  // in many cases we have data-id or data-image-id as attributes on the img
  // we can try to use those to fetch media item nodes as well
  // this will keep us from missing nodes

  const mediaItemDbIds = cheerioImages.map(({
    cheerioImg
  }) => getCheerioImgDbId(cheerioImg)).filter(Boolean);
  const mediaItemRelayIds = mediaItemDbIds.map(dbId => dbIdToMediaItemRelayId(dbId)).filter( // filter out any media item ids we already fetched
  relayId => ![...mediaItemNodesBySourceUrl, ...previouslyCachedNodesByUrl].find(({
    id
  } = {}) => id === relayId));
  const mediaItemNodesById = await (0, _fetchReferencedMediaItems.default)({
    referencedMediaItemNodeIds: mediaItemRelayIds
  });
  const createdNodeIds = [...mediaItemNodesById, ...mediaItemNodesBySourceUrl];
  const mediaItemNodes = [...createdNodeIds, ...previouslyCachedNodesByUrl];
  const htmlMatchesToMediaItemNodesMap = new Map();

  for (const {
    cheerioImg,
    match
  } of cheerioImages) {
    const htmlImgSrc = ensureSrcHasHostname({
      src: cheerioImg.attribs.src,
      wpUrl
    });
    let imageNode = pickNodeBySourceUrlOrCheerioImg({
      url: htmlImgSrc,
      cheerioImg,
      mediaItemNodes
    });

    if (!imageNode && htmlImgSrc) {
      // if we didn't get a media item node for this image,
      // we need to fetch it and create a file node for it with no
      // media item node.
      try {
        const htaccessCredentials = pluginOptions.auth.htaccess;
        imageNode = await (0, _index.default)(Object.assign({
          url: htmlImgSrc,
          parentNodeId: node.id,
          auth: htaccessCredentials ? {
            htaccess_pass: htaccessCredentials === null || htaccessCredentials === void 0 ? void 0 : htaccessCredentials.password,
            htaccess_user: htaccessCredentials === null || htaccessCredentials === void 0 ? void 0 : htaccessCredentials.username
          } : null
        }, helpers, {
          createNode: helpers.actions.createNode
        }));
      } catch (e) {
        var _node$title;

        const sharedError = `when trying to fetch\n${htmlImgSrc}\nfrom ${node.__typename} #${node.databaseId} "${(_node$title = node.title) !== null && _node$title !== void 0 ? _node$title : node.id}"`;
        const nodeEditLink = getNodeEditLink(node);

        if (typeof e === `string` && e.includes(`404`)) {
          helpers.reporter.log(``);
          helpers.reporter.warn((0, _formatLogMessage.formatLogMessage)(`\n\nReceived a 404 ${sharedError}\n\nMost likely this image was uploaded to this ${node.__typename} and then deleted from the media library.\nYou'll need to fix this and re-save this ${node.__typename} to remove this warning at\n${nodeEditLink}.\n\n`));
          imageNode = null;
        } else {
          helpers.reporter.warn(`Received the below error ${sharedError}\n\n${nodeEditLink}\n\n`);
          helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(e));
        }
      }
    }

    cacheCreatedFileNodeBySrc({
      node: imageNode,
      src: htmlImgSrc
    });

    if (imageNode) {
      // match is the html string of the img tag
      htmlMatchesToMediaItemNodesMap.set(match, {
        imageNode,
        cheerioImg
      });
    }
  }

  return htmlMatchesToMediaItemNodesMap;
};

const getCheerioElementFromMatch = wpUrl => ({
  match,
  tag = `img`
}) => {
  var _cheerioElement$attri, _cheerioElement$attri2;

  // unescape quotes
  const parsedMatch = JSON.parse(`"${match}"`); // load our matching img tag into cheerio

  const $ = _cheerio.default.load(parsedMatch, {
    xml: {
      // make sure it's not wrapped in <body></body>
      withDomLvl1: false,
      // no need to normalize whitespace, we're dealing with a single element here
      normalizeWhitespace: false,
      xmlMode: true,
      // entity decoding isn't our job here, that will be the responsibility of WPGQL
      // or of the source plugin elsewhere.
      decodeEntities: false
    }
  }); // there's only ever one element due to our match matching a single tag
  // $(tag) isn't an array, it's an object with a key of 0


  const cheerioElement = $(tag)[0];

  if (cheerioElement === null || cheerioElement === void 0 ? void 0 : (_cheerioElement$attri = cheerioElement.attribs) === null || _cheerioElement$attri === void 0 ? void 0 : (_cheerioElement$attri2 = _cheerioElement$attri.src) === null || _cheerioElement$attri2 === void 0 ? void 0 : _cheerioElement$attri2.startsWith(`/wp-content`)) {
    cheerioElement.attribs.src = `${wpUrl}${cheerioElement.attribs.src}`;
  }

  return {
    match,
    cheerioElement,
    // @todo this is from when this function was just used for images
    // remove this by refactoring
    cheerioImg: cheerioElement
  };
};

const getLargestSizeFromSizesAttribute = sizesString => {
  const sizesStringsArray = sizesString.split(`,`);
  return sizesStringsArray.reduce((largest, currentSizeString) => {
    const maxWidth = currentSizeString.substring(currentSizeString.indexOf(`max-width: `) + 1, currentSizeString.indexOf(`px`)).trim();
    const maxWidthNumber = Number(maxWidth);
    const noLargestAndMaxWidthIsANumber = !largest && !isNaN(maxWidthNumber);
    const maxWidthIsALargerNumberThanLargest = largest && !isNaN(maxWidthNumber) && maxWidthNumber > largest;

    if (noLargestAndMaxWidthIsANumber || maxWidthIsALargerNumberThanLargest) {
      largest = maxWidthNumber;
    }

    return largest;
  }, null);
};

const findImgTagMaxWidthFromCheerioImg = cheerioImg => {
  const {
    attribs: {
      width,
      sizes
    }
  } = cheerioImg || {
    attribs: {
      width: null,
      sizes: null
    }
  };

  if (width) {
    const widthNumber = Number(width);

    if (!isNaN(widthNumber)) {
      return widthNumber;
    }
  }

  if (sizes) {
    const largestSize = getLargestSizeFromSizesAttribute(sizes);

    if (largestSize && !isNaN(largestSize)) {
      return largestSize;
    }
  }

  return null;
};

const getFileNodeRelativePathname = fileNode => {
  const fileName = `${fileNode.internal.contentDigest}/${fileNode.base}`;
  return fileName;
};

const getFileNodePublicPath = fileNode => {
  const fileName = getFileNodeRelativePathname(fileNode);

  const publicPath = _path.default.join(process.cwd(), `public`, `static`, fileName);

  return publicPath;
};

const copyFileToStaticAndReturnUrlPath = async (fileNode, helpers) => {
  var _helpers$pathPrefix;

  const publicPath = getFileNodePublicPath(fileNode);

  if (!_fsExtra.default.existsSync(publicPath)) {
    await _fsExtra.default.copy(fileNode.absolutePath, publicPath, {
      dereference: true
    }, err => {
      if (err) {
        console.error(`error copying file from ${fileNode.absolutePath} to ${publicPath}`, err);
      }
    });
  }

  const fileName = getFileNodeRelativePathname(fileNode);
  const relativeUrl = `${(_helpers$pathPrefix = helpers.pathPrefix) !== null && _helpers$pathPrefix !== void 0 ? _helpers$pathPrefix : ``}/static/${fileName}`;
  return relativeUrl;
};

const filterMatches = wpUrl => ({
  match
}) => {
  const {
    hostname: wpHostname
  } = _url.default.parse(wpUrl); // @todo make it a plugin option to fetch non-wp images
  // here we're filtering out image tags that don't contain our site url


  const isHostedInWp = // if it has the full WP url
  match.includes(wpHostname) || // or it's an absolute path
  match.includes('src=\\"/wp-content'); // six backslashes means we're looking for three backslashes
  // since we're looking for JSON encoded strings inside of our JSON encoded string

  const isInJSON = match.includes(`src=\\\\\\"`);
  return isHostedInWp && !isInJSON;
};

const cacheCreatedFileNodeBySrc = ({
  node,
  src
}) => {
  if (node) {
    // save any fetched media items in our global media item cache
    _store.default.dispatch.imageNodes.pushNodeMeta({
      sourceUrl: src,
      id: node.id,
      modifiedGmt: node.modifiedGmt
    });
  }
};

const replaceNodeHtmlImages = async ({
  nodeString,
  node,
  helpers,
  wpUrl,
  pluginOptions
}) => {
  var _pluginOptions$html;

  // this prevents fetching inline html images
  if (!(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html = pluginOptions.html) === null || _pluginOptions$html === void 0 ? void 0 : _pluginOptions$html.useGatsbyImage)) {
    return nodeString;
  }

  const imgSrcRemoteFileRegex = /(?:src=\\")((?:(?:https?|ftp|file):\/\/|www\.|ftp\.|\/)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])\.(?:jpeg|jpg|png|gif|ico|mpg|ogv|svg|bmp|tif|tiff))(\?[^\\" \.]*|)(?=\\"| |\.)/gim;
  const imageUrlMatches = (0, _execall.default)(imgSrcRemoteFileRegex, nodeString).filter(({
    subMatches
  }) => {
    // if our match is json encoded, that means it's inside a JSON
    // encoded string field.
    const isInJSON = subMatches[0].includes(`\\/\\/`); // we shouldn't process encoded JSON, so skip this match if it's JSON

    return !isInJSON;
  });
  const imgTagMatches = (0, _execall.default)(/<img([\w\W]+?)[\/]?>/gim, nodeString // we don't want to match images inside pre
  .replace(/<pre([\w\W]+?)[\/]?>.*(<\/pre>)/gim, ``) // and code tags, so temporarily remove those tags and everything inside them
  .replace(/<code([\w\W]+?)[\/]?>.*(<\/code>)/gim, ``)).filter(filterMatches(wpUrl));

  if (imageUrlMatches.length && imgTagMatches.length) {
    const cheerioImages = imgTagMatches.map(getCheerioElementFromMatch(wpUrl)).filter(({
      cheerioImg: {
        attribs
      }
    }) => {
      if (!attribs.src) {
        return false;
      }

      return (0, _validUrl.isWebUri)(attribs.src);
    });
    const htmlMatchesToMediaItemNodesMap = await fetchNodeHtmlImageMediaItemNodes({
      cheerioImages,
      nodeString,
      node,
      helpers,
      pluginOptions,
      wpUrl
    }); // generate gatsby images for each cheerioImage

    const htmlMatchesWithImageResizes = await Promise.all(imgTagMatches.map(async ({
      match
    }) => {
      var _imageNode$mediaDetai, _pluginOptions$html2, _ref, _pluginOptions$html3;

      const matchInfo = htmlMatchesToMediaItemNodesMap.get(match);

      if (!matchInfo) {
        return null;
      }

      const {
        imageNode,
        cheerioImg
      } = matchInfo;
      const isMediaItemNode = imageNode.__typename === `MediaItem`;

      if (!imageNode) {
        return null;
      }

      const fileNode = // if we couldn't get a MediaItem node for this image in WPGQL
      !isMediaItemNode ? // this will already be a file node
      imageNode : // otherwise grab the file node
      helpers.getNode(imageNode.localFile.id);
      const imgTagMaxWidth = findImgTagMaxWidthFromCheerioImg(cheerioImg);
      const mediaItemNodeWidth = isMediaItemNode ? imageNode === null || imageNode === void 0 ? void 0 : (_imageNode$mediaDetai = imageNode.mediaDetails) === null || _imageNode$mediaDetai === void 0 ? void 0 : _imageNode$mediaDetai.width : null; // if a max width can't be inferred from html, this value will be passed to Sharp

      let fallbackImageMaxWidth = pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html2 = pluginOptions.html) === null || _pluginOptions$html2 === void 0 ? void 0 : _pluginOptions$html2.fallbackImageMaxWidth;

      if ( // if the image is smaller than the fallback max width,
      // the images width will be used instead if we have a media item node
      fallbackImageMaxWidth > mediaItemNodeWidth && // of course that means we have to have a media item node
      // and a media item node max width
      mediaItemNodeWidth && typeof mediaItemNodeWidth === `number` && mediaItemNodeWidth > 0) {
        fallbackImageMaxWidth = mediaItemNodeWidth;
      }

      const maxWidth = // if we inferred a maxwidth from html
      (_ref = imgTagMaxWidth && // and we have a media item node to know it's full size max width
      mediaItemNodeWidth && // and this isn't an svg which has no maximum width
      fileNode.extension !== `svg` && // and the media item node max width is smaller than what we inferred
      // from html
      mediaItemNodeWidth < imgTagMaxWidth ? // use the media item node width
      mediaItemNodeWidth : // otherwise use the width inferred from html
      imgTagMaxWidth) !== null && _ref !== void 0 ? _ref : // if we don't have a media item node and we inferred no width
      // from html, then use the fallback max width from plugin options
      fallbackImageMaxWidth;
      const quality = pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html3 = pluginOptions.html) === null || _pluginOptions$html3 === void 0 ? void 0 : _pluginOptions$html3.imageQuality;
      const {
        reporter,
        cache,
        pathPrefix
      } = helpers;
      const gatsbyTransformerSharpSupportsThisFileType = _supportedExtensions.supportedExtensions[fileNode === null || fileNode === void 0 ? void 0 : fileNode.extension];
      let fluidResult = null;

      if (gatsbyTransformerSharpSupportsThisFileType) {
        try {
          fluidResult = await (0, _gatsbyPluginSharp.fluid)({
            file: fileNode,
            args: {
              maxWidth,
              quality,
              pathPrefix
            },
            reporter,
            cache
          });
        } catch (e) {
          reporter.error(e);
          reporter.warn((0, _formatLogMessage.formatLogMessage)(`${node.__typename} ${node.id} couldn't process inline html image ${fileNode.url}`));
          return null;
        }
      }

      return {
        match,
        cheerioImg,
        fileNode,
        imageResize: fluidResult,
        maxWidth
      };
    })); // find/replace mutate nodeString to replace matched images with rendered gatsby images

    for (const matchResize of htmlMatchesWithImageResizes) {
      var _cheerioImg$attribs, _cheerioImg$attribs2;

      if (!matchResize) {
        continue;
      }

      const {
        match,
        imageResize,
        cheerioImg,
        maxWidth
      } = matchResize; // @todo retain img tag classes and attributes from cheerioImg

      const imgOptions = {
        style: {
          // these styles make it so that the image wont be stretched
          // beyond it's max width, but it also wont exceed the width
          // of it's parent element
          maxWidth: "100%",
          width: `${maxWidth}px`
        },
        placeholderStyle: {
          opacity: 0
        },
        className: cheerioImg === null || cheerioImg === void 0 ? void 0 : (_cheerioImg$attribs = cheerioImg.attribs) === null || _cheerioImg$attribs === void 0 ? void 0 : _cheerioImg$attribs.class,
        // Force show full image instantly
        loading: "eager",
        alt: cheerioImg === null || cheerioImg === void 0 ? void 0 : (_cheerioImg$attribs2 = cheerioImg.attribs) === null || _cheerioImg$attribs2 === void 0 ? void 0 : _cheerioImg$attribs2.alt,
        fadeIn: true,
        imgStyle: {
          opacity: 1
        }
      };
      let ReactGatsbyImage;

      if (imageResize) {
        imgOptions.fluid = imageResize;
        ReactGatsbyImage = /*#__PURE__*/_react.default.createElement(_gatsbyImage.default, imgOptions, null);
      } else {
        const {
          fileNode
        } = matchResize;
        const relativeUrl = await copyFileToStaticAndReturnUrlPath(fileNode, helpers);
        imgOptions.src = relativeUrl;
        delete imgOptions.imgStyle;
        delete imgOptions.fadeIn;
        delete imgOptions.placeholderStyle;
        ReactGatsbyImage = /*#__PURE__*/_react.default.createElement(`img`, imgOptions, null);
      }

      const gatsbyImageStringJSON = JSON.stringify(_server.default.renderToString(ReactGatsbyImage)); // need to remove the JSON stringify quotes around our image since we're
      // threading this JSON string back into a larger JSON object string

      const gatsbyImageString = gatsbyImageStringJSON.substring(1, gatsbyImageStringJSON.length - 1);
      nodeString = (0, _replaceall.default)(match, gatsbyImageString, nodeString);
    }
  }

  return nodeString;
};

const replaceFileLinks = async ({
  nodeString,
  helpers,
  wpUrl,
  pluginOptions
}) => {
  var _pluginOptions$html4;

  if (!(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$html4 = pluginOptions.html) === null || _pluginOptions$html4 === void 0 ? void 0 : _pluginOptions$html4.createStaticFiles)) {
    return nodeString;
  }

  const hrefMatches = (0, _execall.default)(/(\\"|\\'|\()([^'"()]*)(\/wp-content\/uploads\/[^'">()]+)(\\"|\\'|>|\))/gm, nodeString);

  if (hrefMatches.length) {
    const mediaItemUrlsAndMatches = hrefMatches.map(matchGroup => ({
      matchGroup,
      url: `${wpUrl}${matchGroup.subMatches[2]}`
    }));
    const mediaItemUrls = mediaItemUrlsAndMatches.map(({
      url
    }) => url).filter(_validUrl.isWebUri);
    const mediaItemNodesBySourceUrl = await (0, _fetchReferencedMediaItems.default)({
      mediaItemUrls
    });
    const findReplaceMaps = [];
    await Promise.all(mediaItemNodesBySourceUrl.map(async node => {
      var _node$localFile, _mediaItemUrlsAndMatc;

      let fileNode;
      let mediaItemNode;

      if (node.internal.type === `File`) {
        fileNode = node;
        mediaItemNode = await helpers.getNode(node.parent);
      } else if ((_node$localFile = node.localFile) === null || _node$localFile === void 0 ? void 0 : _node$localFile.id) {
        fileNode = await helpers.getNode(node.localFile.id);
        mediaItemNode = node;
      } else {
        return null;
      }

      const relativeUrl = await copyFileToStaticAndReturnUrlPath(fileNode, helpers);

      if (!relativeUrl || !mediaItemNode || !fileNode) {
        return null;
      }

      const mediaItemMatchGroup = (_mediaItemUrlsAndMatc = mediaItemUrlsAndMatches.find(({
        matchGroup: {
          subMatches: [_delimiter, _hostname, path]
        }
      }) => mediaItemNode.mediaItemUrl.includes(path))) === null || _mediaItemUrlsAndMatc === void 0 ? void 0 : _mediaItemUrlsAndMatc.matchGroup;

      if (!mediaItemMatchGroup) {
        return null;
      }

      const [_delimiterOpen, hostname, path, _delimiterClose] = mediaItemMatchGroup === null || mediaItemMatchGroup === void 0 ? void 0 : mediaItemMatchGroup.subMatches;
      cacheCreatedFileNodeBySrc({
        node: mediaItemNode,
        src: `${wpUrl}${path}`
      });
      findReplaceMaps.push({
        find: `${hostname || ``}${path}`,
        replace: relativeUrl
      });
      findReplaceMaps.push({
        find: path,
        replace: relativeUrl
      });
    }));

    for (const {
      find,
      replace
    } of findReplaceMaps.filter(Boolean)) {
      nodeString = (0, _replaceall.default)(find, replace, nodeString);
    }
  }

  return nodeString;
}; // replaces any url which is a front-end WP url with a relative path


const replaceNodeHtmlLinks = ({
  wpUrl,
  nodeString,
  node
}) => {
  const wpLinkRegex = new RegExp(`["']${wpUrl}(?!/wp-content|/wp-admin|/wp-includes)(/[^'"]+)["']`, `gim`);
  const linkMatches = (0, _execall.default)(wpLinkRegex, nodeString);

  if (linkMatches.length) {
    linkMatches.forEach(({
      match,
      subMatches: [path]
    }) => {
      if (path) {
        try {
          // remove \, " and ' characters from match
          const normalizedMatch = match.replace(/['"\\]/g, ``);
          const normalizedPath = path.replace(/\\/g, ``); // replace normalized match with relative path

          const thisMatchRegex = new RegExp(normalizedMatch, `g`);
          nodeString = nodeString.replace(thisMatchRegex, normalizedPath);
        } catch (e) {
          console.error(e);
          console.warning((0, _formatLogMessage.formatLogMessage)(`Failed to process inline html links in ${node.__typename} ${node.id}`));
        }
      }
    });
  }

  return nodeString;
};

const processNodeString = async ({
  nodeString,
  node,
  pluginOptions,
  helpers,
  wpUrl
}) => {
  const nodeStringFilters = [replaceNodeHtmlImages, replaceFileLinks, replaceNodeHtmlLinks];

  for (const nodeStringFilter of nodeStringFilters) {
    nodeString = await nodeStringFilter({
      nodeString,
      node,
      pluginOptions,
      helpers,
      wpUrl
    });
  }

  return nodeString;
};

const processNode = async ({
  node,
  pluginOptions,
  wpUrl,
  helpers,
  referencedMediaItemNodeIds
}) => {
  const nodeString = (0, _fastJsonStableStringify.default)(node); // find referenced node ids
  // here we're searching for node id strings in our node
  // we use this to download only the media items
  // that are being used in posts
  // this is important for downloading images nodes that are connected somewhere
  // on a node field

  const nodeMediaItemIdReferences = findReferencedImageNodeIds({
    nodeString,
    pluginOptions,
    node
  }); // push them to our store of referenced id's

  if ((nodeMediaItemIdReferences === null || nodeMediaItemIdReferences === void 0 ? void 0 : nodeMediaItemIdReferences.length) && referencedMediaItemNodeIds) {
    nodeMediaItemIdReferences.forEach(id => referencedMediaItemNodeIds.add(id));
  }

  const processedNodeString = await processNodeString({
    nodeString,
    node,
    pluginOptions,
    helpers,
    wpUrl
  }); // only parse if the nodeString has changed

  if (processedNodeString !== nodeString) {
    return JSON.parse(processedNodeString);
  } else {
    return node;
  }
};

exports.processNode = processNode;