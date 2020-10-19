"use strict";

exports.__esModule = true;
exports.typeDefinitionFilters = void 0;

var _createRemoteMediaItemNode = require("../source-nodes/create-nodes/create-remote-media-item-node");

// @todo move this to plugin options
const typeDefinitionFilters = [{
  typeName: `__all`,
  typeDef: typeDef => {
    var _typeDef$fields, _typeDef$fields2, _typeDef$fields3, _typeDef$fields4;

    /**
     * @todo once WPGraphQL has a DateTime Scalar, use that to find date fields
     * instead of the below fieldnames
     */
    if (typeDef === null || typeDef === void 0 ? void 0 : (_typeDef$fields = typeDef.fields) === null || _typeDef$fields === void 0 ? void 0 : _typeDef$fields.date) {
      const dateField = Object.assign({}, typeDef.fields.date, {
        type: `Date`,
        extensions: {
          dateformat: {}
        }
      });
      typeDef.fields.date = dateField;
    }

    if (typeDef === null || typeDef === void 0 ? void 0 : (_typeDef$fields2 = typeDef.fields) === null || _typeDef$fields2 === void 0 ? void 0 : _typeDef$fields2.dateGmt) {
      const dateField = Object.assign({}, typeDef.fields.dateGmt, {
        type: `Date`,
        extensions: {
          dateformat: {}
        }
      });
      typeDef.fields.dateGmt = dateField;
    }

    if (typeDef === null || typeDef === void 0 ? void 0 : (_typeDef$fields3 = typeDef.fields) === null || _typeDef$fields3 === void 0 ? void 0 : _typeDef$fields3.modified) {
      const dateField = Object.assign({}, typeDef.fields.modified, {
        type: `Date`,
        extensions: {
          dateformat: {}
        }
      });
      typeDef.fields.modified = dateField;
    }

    if (typeDef === null || typeDef === void 0 ? void 0 : (_typeDef$fields4 = typeDef.fields) === null || _typeDef$fields4 === void 0 ? void 0 : _typeDef$fields4.modifiedGmt) {
      const dateField = Object.assign({}, typeDef.fields.modifiedGmt, {
        type: `Date`,
        extensions: {
          dateformat: {}
        }
      });
      typeDef.fields.modifiedGmt = dateField;
    }

    return typeDef;
  }
}, {
  typeName: `MediaItem`,
  typeDef: (objectType, {
    pluginOptions
  }) => {
    // @todo: this field is deprecated as of 0.1.8, remove this when we get to beta
    objectType.fields.remoteFile = {
      type: `File`,
      deprecationReason: `MediaItem.remoteFile was renamed to localFile`,
      resolve: () => {
        throw new Error(`MediaItem.remoteFile is deprecated and has been renamed to MediaItem.localFile. Please update your code.`);
      }
    };
    objectType.fields.localFile = {
      type: `File`,
      resolve: (mediaItemNode, _, context) => {
        var _mediaItemNode$localF;

        if (!mediaItemNode) {
          return null;
        }

        const localMediaNodeId = mediaItemNode === null || mediaItemNode === void 0 ? void 0 : (_mediaItemNode$localF = mediaItemNode.localFile) === null || _mediaItemNode$localF === void 0 ? void 0 : _mediaItemNode$localF.id;

        if (localMediaNodeId) {
          const node = context.nodeModel.getNodeById({
            id: mediaItemNode.localFile.id,
            type: `File`
          });

          if (node) {
            return node;
          }
        }

        return (0, _createRemoteMediaItemNode.createRemoteMediaItemNode)({
          mediaItemNode,
          parentName: `Creating File node while resolving missing MediaItem.localFile`
        });
      }
    };
    return objectType;
  }
}];
exports.typeDefinitionFilters = typeDefinitionFilters;