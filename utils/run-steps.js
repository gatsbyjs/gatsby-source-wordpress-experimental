"use strict";

exports.__esModule = true;
exports.runApisInSteps = exports.runSteps = void 0;

var _formatLogMessage = require("./format-log-message");

const runSteps = async (steps, helpers, pluginOptions, apiName) => {
  for (const step of steps) {
    try {
      var _pluginOptions$debug;

      const {
        timeBuildSteps
      } = (_pluginOptions$debug = pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.debug) !== null && _pluginOptions$debug !== void 0 ? _pluginOptions$debug : {};
      const timeStep = typeof timeBuildSteps === `boolean` ? timeBuildSteps : (timeBuildSteps === null || timeBuildSteps === void 0 ? void 0 : timeBuildSteps.includes(step.name)) || (timeBuildSteps === null || timeBuildSteps === void 0 ? void 0 : timeBuildSteps.includes(apiName));
      let activity;

      if (timeStep) {
        activity = helpers.reporter.activityTimer((0, _formatLogMessage.formatLogMessage)(`step -${!apiName ? `-` : ``}> ${step.name}`, {
          useVerboseStyle: true
        }));
        activity.start();
      }

      if (typeof step === `function`) {
        await step(helpers, pluginOptions);
      } else if (Array.isArray(step)) {
        await runSteps(step, helpers, pluginOptions, apiName);
      }

      if (activity) {
        activity.end();
      }
    } catch (e) {
      helpers.reporter.error(e);
      helpers.reporter.panic((0, _formatLogMessage.formatLogMessage)(`\n\n\tEncountered a critical error when running the ${apiName ? `${apiName}.` : ``}${step.name} build step.\n\tSee above for more information.`, {
        useVerboseStyle: true
      }));
    }
  }
};

exports.runSteps = runSteps;

const runApiSteps = (steps, apiName) => async (helpers, pluginOptions) => runSteps(steps, helpers, pluginOptions, apiName);

const runApisInSteps = nodeApis => Object.entries(nodeApis).reduce((gatsbyNodeExportObject, [apiName, apiSteps]) => Object.assign({}, gatsbyNodeExportObject, {
  [apiName]: runApiSteps(apiSteps, apiName)
}), {});

exports.runApisInSteps = runApisInSteps;