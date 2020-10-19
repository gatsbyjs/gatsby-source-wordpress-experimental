"use strict";

exports.__esModule = true;
exports.ingestRemoteSchema = void 0;

var _runSteps = require("../../utils/run-steps");

var _formatLogMessage = require("../../utils/format-log-message");

var _diffSchemas = require("./diff-schemas");

var _introspectRemoteSchema = require("./introspect-remote-schema");

var _identifyAndStoreIngestableTypes = require("./identify-and-store-ingestable-types");

var _buildAndStoreIngestibleRootFieldNonNodeQueries = require("./build-and-store-ingestible-root-field-non-node-queries");

var _buildNodeQueries = require("./build-queries-from-introspection/build-node-queries");

var _cacheFetchedTypes = require("./cache-fetched-types");

var _writeQueriesToDisk = require("./write-queries-to-disk");

const ingestRemoteSchema = async (helpers, pluginOptions) => {
  // @todo if this is an inc build or preview, we need quicker logic
  // around determining if the remote schema has changed.
  // for now, we need to do a full check each time
  // Eventually this should happen per-Type
  // if (helpers.traceId === `refresh-createSchemaCustomization`) {
  //   return
  // }
  const activity = helpers.reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`ingest WPGraphQL schema`));
  activity.start();

  try {
    await (0, _runSteps.runSteps)([_diffSchemas.checkIfSchemaHasChanged, _introspectRemoteSchema.introspectAndStoreRemoteSchema, _identifyAndStoreIngestableTypes.identifyAndStoreIngestableFieldsAndTypes, [_buildNodeQueries.buildNodeQueries, _buildAndStoreIngestibleRootFieldNonNodeQueries.buildNonNodeQueries], [_cacheFetchedTypes.cacheFetchedTypes, _writeQueriesToDisk.writeQueriesToDisk]], helpers, pluginOptions);
  } catch (e) {
    helpers.reporter.panic(e);
  }

  activity.end();
};

exports.ingestRemoteSchema = ingestRemoteSchema;