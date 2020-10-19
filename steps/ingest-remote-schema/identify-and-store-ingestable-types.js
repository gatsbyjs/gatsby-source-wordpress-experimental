"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.identifyAndStoreIngestableFieldsAndTypes = void 0;

var _store = _interopRequireDefault(require("../../store"));

var _isExcluded = require("./is-excluded");

var _helpers = require("../create-schema-customization/helpers");

var _cache = require("../../utils/cache");

const identifyAndStoreIngestableFieldsAndTypes = async () => {
  const nodeListFilter = field => field.name === `nodes`;

  const state = _store.default.getState();

  const {
    introspectionData,
    fieldBlacklist,
    typeMap
  } = state.remoteSchema;
  const {
    pluginOptions
  } = state.gatsbyApi;
  const cachedFetchedTypes = await (0, _cache.getPersistentCache)({
    key: `previously-fetched-types`
  });

  if (cachedFetchedTypes) {
    const restoredFetchedTypesMap = new Map(cachedFetchedTypes);

    _store.default.dispatch.remoteSchema.setState({
      fetchedTypes: restoredFetchedTypesMap
    });
  }

  if (pluginOptions.type) {
    Object.entries(pluginOptions.type).forEach(([typeName, typeSettings]) => {
      var _pluginOptions$type, _pluginOptions$type$_;

      // our lazy types won't initially be fetched,
      // so we need to mark them as fetched here
      if ((typeSettings.lazyNodes || ((_pluginOptions$type = pluginOptions.type) === null || _pluginOptions$type === void 0 ? void 0 : (_pluginOptions$type$_ = _pluginOptions$type.__all) === null || _pluginOptions$type$_ === void 0 ? void 0 : _pluginOptions$type$_.lazyNodes)) && !(0, _isExcluded.typeIsExcluded)({
        pluginOptions,
        typeName
      })) {
        const lazyType = typeMap.get(typeName);

        _store.default.dispatch.remoteSchema.addFetchedType(lazyType);
      }
    });
  }

  const interfaces = introspectionData.__schema.types.filter(type => type.kind === `INTERFACE`);

  for (const interfaceType of interfaces) {
    if ((0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: interfaceType.name
    })) {
      continue;
    }

    _store.default.dispatch.remoteSchema.addFetchedType(interfaceType);

    if (interfaceType.fields) {
      for (const interfaceField of interfaceType.fields) {
        if (interfaceField.type) {
          _store.default.dispatch.remoteSchema.addFetchedType(interfaceField.type);
        }
      }
    }
  }

  const rootFields = typeMap.get(`RootQuery`).fields;
  const nodeInterfaceTypes = [];
  const nodeListRootFields = [];
  const nonNodeRootFields = [];
  const nodeInterfacePossibleTypeNames = [];

  for (const field of rootFields) {
    var _field$args, _pluginOptions$type$R, _pluginOptions$type$R2;

    const fieldHasNonNullArgs = field.args.some(arg => arg.type.kind === `NON_NULL`);

    if (fieldHasNonNullArgs) {
      // we can't know what those args should be, so skip this field
      continue;
    }

    if ((0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: field.type.name
    })) {
      continue;
    }

    if (field.type.kind === `OBJECT`) {
      var _type$fields;

      const type = typeMap.get(field.type.name);
      const nodeField = type === null || type === void 0 ? void 0 : (_type$fields = type.fields) === null || _type$fields === void 0 ? void 0 : _type$fields.find(nodeListFilter);

      if (nodeField && nodeField.type.ofType.kind === `INTERFACE`) {
        const nodeListField = type.fields.find(nodeListFilter);

        if (nodeListField) {
          var _pluginOptions$type2, _pluginOptions$type2$;

          nodeInterfaceTypes.push(nodeListField.type.ofType.name);

          _store.default.dispatch.remoteSchema.addFetchedType(nodeListField.type);

          const nodeListFieldType = typeMap.get(nodeListField.type.ofType.name);

          for (const innerField of nodeListFieldType.fields) {
            _store.default.dispatch.remoteSchema.addFetchedType(innerField.type);
          }

          if ( // if we haven't marked this as a nodeInterface type then push this to root fields to fetch it
          // nodeInterface is different than a node which is an interface type.
          // In Gatsby nodeInterface means the node data is pulled from a different type. On the WP side we can also have nodes that are of an interface type, but we only pull them from a single root field
          // the problem is that if we don't mark them as a node list root field
          // we don't know to identify them later as being a node type that will have been fetched and we also wont try to fetch this type during node sourcing.
          !(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$type2 = pluginOptions.type) === null || _pluginOptions$type2 === void 0 ? void 0 : (_pluginOptions$type2$ = _pluginOptions$type2[nodeListField.type.ofType.name]) === null || _pluginOptions$type2$ === void 0 ? void 0 : _pluginOptions$type2$.nodeInterface)) {
            var _nodeInterfaceType$po;

            const nodeInterfaceType = typeMap.get((0, _helpers.findTypeName)(nodeListField.type)); // we need to mark all the possible types as being fetched
            // and also need to record the possible type as a node type

            nodeInterfaceType === null || nodeInterfaceType === void 0 ? void 0 : (_nodeInterfaceType$po = nodeInterfaceType.possibleTypes) === null || _nodeInterfaceType$po === void 0 ? void 0 : _nodeInterfaceType$po.forEach(type => {
              nodeInterfacePossibleTypeNames.push(type.name);

              _store.default.dispatch.remoteSchema.addFetchedType(type);
            });
            nodeListRootFields.push(field);
          }

          continue;
        }
      } else if (nodeField) {
        if (fieldBlacklist.includes(field.name)) {
          continue;
        }

        _store.default.dispatch.remoteSchema.addFetchedType(nodeField.type);

        nodeListRootFields.push(field);
        continue;
      }
    }

    if (fieldBlacklist.includes(field.name)) {
      continue;
    }

    const takesIDinput = field === null || field === void 0 ? void 0 : (_field$args = field.args) === null || _field$args === void 0 ? void 0 : _field$args.find(arg => arg.type.name === `ID`); // if a non-node root field takes an id input, we 99% likely can't use it.
    // so don't fetch it and don't add it to the schema.

    if (takesIDinput) {
      continue;
    }

    if ( // if this type is excluded on the RootQuery, skip it
    (_pluginOptions$type$R = pluginOptions.type.RootQuery) === null || _pluginOptions$type$R === void 0 ? void 0 : (_pluginOptions$type$R2 = _pluginOptions$type$R.excludeFieldNames) === null || _pluginOptions$type$R2 === void 0 ? void 0 : _pluginOptions$type$R2.find(excludedFieldName => excludedFieldName === field.name)) {
      continue;
    } // we don't need to mark types as fetched if they're supported SCALAR types


    if (!(0, _helpers.typeIsABuiltInScalar)(field.type)) {
      _store.default.dispatch.remoteSchema.addFetchedType(field.type);
    }

    nonNodeRootFields.push(field);
  }

  const nodeListFieldNames = nodeListRootFields.map(field => field.name);
  const nodeListTypeNames = [...nodeInterfacePossibleTypeNames, ...nodeListRootFields.map(field => {
    const connectionType = typeMap.get(field.type.name);
    const nodesField = connectionType.fields.find(nodeListFilter);
    return nodesField.type.ofType.name;
  })];
  const gatsbyNodesInfo = {
    fieldNames: nodeListFieldNames,
    typeNames: nodeListTypeNames
  };

  _store.default.dispatch.remoteSchema.setState({
    gatsbyNodesInfo,
    ingestibles: {
      nodeListRootFields,
      nonNodeRootFields,
      nodeInterfaceTypes
    }
  });
};

exports.identifyAndStoreIngestableFieldsAndTypes = identifyAndStoreIngestableFieldsAndTypes;