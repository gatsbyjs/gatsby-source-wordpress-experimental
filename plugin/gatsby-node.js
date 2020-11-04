const { runApisInSteps } = require(`./dist/utils/run-steps`)
const steps = require(`./dist/steps/index`)

module.exports = runApisInSteps({
  onPreInit: [steps.setErrorMap, steps.tempPreventMultipleInstances],

  createSchemaCustomization: [
    steps.setGatsbyApiToState,
    steps.ensurePluginRequirementsAreMet,
    steps.ingestRemoteSchema,
    steps.createSchemaCustomization,
  ],

  sourceNodes: [
    steps.setGatsbyApiToState,
    [
      steps.persistPreviouslyCachedImages,
      steps.sourcePreviews,
      steps.sourceNodes,
    ],
    steps.setImageNodeIdCache,
  ],

  onPostBuild: [steps.setImageNodeIdCache],

  onCreateDevServer: [
    [steps.setImageNodeIdCache, steps.startPollingForContentUpdates],
  ],
})

exports.pluginOptionsSchema = ({ Joi }) => Joi.object({
  url: Joi.string().required().description(`The full url of your GraphQL endpoint`),
  verbose: Joi.boolean().default(true).description(`Wether there will be verbose output in the terminal`),
  debug: Joi.object({
    graphql: Joi.object({
      showQueryVarsOnError: Joi.boolean().default(false).description(`When a GraphQL error is returned and the process exits, this plugin option determines wether or not to log out the query vars that were used in the query that returned GraphQL errors.`),
      panicOnError: Joi.boolean().default(false).description(`Determines wether or not to panic when any GraphQL error is returned. Default is false because sometimes non-critical errors are returned alongside valid data.`),
      onlyReportCriticalErrors: Joi.boolean().default(true).description(`Determines wether or not to log non-critical errors. A non-critical error is any error which is returned alongside valid data. In previous versions of WPGraphQL this was very noisy because trying to access an entity that was private returned errors. Default is true.`),
      writeQueriesToDisk: Joi.boolean().default(false).description(`When true, all internal GraphQL queries generated during node sourcing will be written out to ./WordPress/GraphQL/[TypeName]/*.graphql for every type that is sourced. This is very useful for debugging GraphQL errors.`),
    })
  }).description(`Options related to debugging.`),
  develop: Joi.object({
    nodeUpdateInterval: Joi.number().integer().default(300).description(`Specifies in milliseconds how often Gatsby will ask WP if data has changed during development. If you want to see data update in near-realtime while you're developing, set this low. Your server may have trouble responding to too many requests over a long period of time and in that case, set this high. Setting it higher saves electricity too ⚡️🌲`),
    hardCacheMediaFiles: Joi.boolean().default(false).description(`This option is experimental. When set to true, media files will be hard-cached outside the Gatsby cache at ./.wordpress-cache/path/to/media/file.jpeg. This is useful for preventing media files from being re-downloaded when the Gatsby cache automatically clears. When using this option, be sure to gitignore the wordpress-cache directory in the root of your project.`),
    hardCacheData: Joi.boolean().default(false).description(`This option is experimental. When set to true, WordPress data will be hard-cached outside the Gatsby cache in ./.wordpress-cache/caches. This is useful for preventing the need to re-fetch all data when the Gatsby cache automatically clears. This hard cache will automatically clear itself when your remote WPGraphQL schema changes, or when you change your plugin options. When using this option, be sure to gitignore the wordpress-cache directory in the root of your project.`),
  }).description(`Options related to the gatsby develop process.`),
  auth: Joi.object({
    htaccess: Joi.object({
      username: Joi.string().default(null).description(`The username for your .htpassword protected site.`),
      password: Joi.string().default(null).description(`The password for your .htpassword protected site.`),
    }).description(`Options related to htaccess authentication.`)
  }).description(`Options related to htaccess authentication.`),
  schema: Joi.object({
    typePrefix: Joi.string().default(`Wp`).description(`The prefix for all ingested types from the remote schema. For example Post becomes WpPost.`),
    timeout: Joi.number().integer().default(30 * 1000).description(`The amount of time in ms before GraphQL requests will time out.`),
    perPage: Joi.number().integer().default(100).description(`The number of nodes to fetch per page during node sourcing.`),
  }).description(`Options related to fetching and ingesting the remote schema.`),
  excludeFieldNames: Joi.array().items(Joi.string()).description(`A list of field names to globally exclude from the ingested schema.`),
  html: Joi.object({
    useGatsbyImage: Joi.boolean().default(true).description(`Causes the source plugin to find/replace images in html with Gatsby images.`),
    imageMaxWidth: Joi.number().integer().default(null).description(`Adds a limit to the max width an image can be. If the image size selected in WP is smaller or the image file width is smaller than this those values will be used instead.`),
    fallbackImageMaxWidth: Joi.number().integer().default(100).description(`If a max width can't be inferred from html this value will be passed to Sharp. If the image is smaller than this, the image file's width will be used instead.`),
    imageQuality: Joi.number().integer().default(90).description(`Determines the image quality that Sharp will use when generating inline html image thumbnails.`),
    createStaticFiles: Joi.boolean().default(true).description(`When this is true, any url's which are wrapped in "", '', or () and which contain /wp-content/uploads will be transformed into static files and the url's will be rewritten. This adds support for , , and tags which point at WP media item uploads as well as inline-html css like background-image: url().`)
  }).description(`Options related to html field processing.`),
})
