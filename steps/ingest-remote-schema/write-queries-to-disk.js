"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.writeQueriesToDisk = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _store = _interopRequireDefault(require("../../store"));

var _prettier = _interopRequireDefault(require("prettier"));

var _formatLogMessage = require("../../utils/format-log-message");

const writeQueriesToDisk = async ({
  reporter
}, pluginOptions) => {
  var _pluginOptions$debug, _pluginOptions$debug$;

  if (!(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$debug = pluginOptions.debug) === null || _pluginOptions$debug === void 0 ? void 0 : (_pluginOptions$debug$ = _pluginOptions$debug.graphql) === null || _pluginOptions$debug$ === void 0 ? void 0 : _pluginOptions$debug$.writeQueriesToDisk)) {
    return;
  }

  const {
    remoteSchema
  } = _store.default.getState(); // the queries only change when the remote schema changes
  // no need to write them to disk in that case


  if (!remoteSchema.schemaWasChanged) {
    return;
  }

  const activity = reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`writing GraphQL queries to disk at ./WordPress/GraphQL/`));
  activity.start();
  const wordPressGraphQLDirectory = `${process.cwd()}/WordPress/GraphQL`; // remove before writing in case there are old types

  await _fsExtra.default.remove(wordPressGraphQLDirectory);

  for (const {
    nodeListQueries,
    nodeQuery,
    previewQuery,
    typeInfo
  } of Object.values(remoteSchema.nodeQueries)) {
    const directory = `${wordPressGraphQLDirectory}/${typeInfo.nodesTypeName}`;
    await _fsExtra.default.ensureDir(directory);
    await _fsExtra.default.writeFile(`${directory}/node-list-query.graphql`, _prettier.default.format(nodeListQueries[0], {
      parser: `graphql`
    }), `utf8`);
    await _fsExtra.default.writeFile(`${directory}/node-single-query.graphql`, _prettier.default.format(nodeQuery, {
      parser: `graphql`
    }), `utf8`);
    await _fsExtra.default.writeFile(`${directory}/node-preview-query.graphql`, _prettier.default.format(previewQuery, {
      parser: `graphql`
    }), `utf8`);
  }

  const directory = `${wordPressGraphQLDirectory}/RootQuery`;
  await _fsExtra.default.ensureDir(directory);
  await _fsExtra.default.writeFile(`${directory}/non-node-root-query.graphql`, _prettier.default.format(remoteSchema.nonNodeQuery, {
    parser: `graphql`
  }));
  activity.end();
};

exports.writeQueriesToDisk = writeQueriesToDisk;