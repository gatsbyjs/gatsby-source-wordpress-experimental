"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.setGatsbyApiToState = void 0;

var _store = _interopRequireDefault(require("../store"));

var _processAndValidatePluginOptions = require("./process-and-validate-plugin-options");

const setGatsbyApiToState = (helpers, pluginOptions) => {
  if (helpers.traceId === `refresh-createSchemaCustomization`) {
    return;
  }

  const filteredPluginOptions = (0, _processAndValidatePluginOptions.processAndValidatePluginOptions)(helpers, pluginOptions); //
  // add the plugin options and Gatsby API helpers to our store
  // to access them more easily

  _store.default.dispatch.gatsbyApi.setState({
    helpers,
    pluginOptions: filteredPluginOptions
  });
};

exports.setGatsbyApiToState = setGatsbyApiToState;