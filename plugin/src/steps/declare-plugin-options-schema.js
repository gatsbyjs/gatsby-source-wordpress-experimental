export function pluginOptionsSchema({ Joi }) {
  const getTypeOptions = () =>
    Joi.object({
      exclude: Joi.boolean()
        .allow(null)
        .description(
          `Completely excludes a type from node sourcing and from the ingested schema.`
        ),
      limit: Joi.number()
        .integer()
        .allow(null)
        .allow(false)
        .description(
          `The maximum amount of objects of this type to fetch from WordPress.`
        ),
      excludeFieldNames: Joi.array()
        .items(Joi.string())
        .allow(null)
        .allow(false)
        .description(`Excludes fields on a type by field name.`),
      nodeInterface: Joi.boolean()
        .allow(null)
        .allow(false)
        .description(
          `Determines wether or not this type will be treated as an interface comprised entirely of other Gatsby node types.`
        ),
      beforeChangeNode: Joi.function()
        .allow(null)
        .allow(false)
        .description(
          `A function which is invoked before a node is created, updated, or deleted. This is a hook in point to modify the node or perform side-effects related to it.`
        ),
    })

  return Joi.object({
    url: Joi.string()
      .required()
      .description(`The full url of your GraphQL endpoint`),
    verbose: Joi.boolean()
      .default(true)
      .description(`Wether there will be verbose output in the terminal`),
    debug: Joi.object({
      timeBuildSteps: Joi.boolean()
        .default(false)
        .description(
          `When set to true, this option will display how long each internal step took during the build process.`
        ),
      disableCompatibilityCheck: Joi.boolean()
        .default(false)
        .description(
          `This option disables the compatibility API check against the remote WPGraphQL and WPGatsby plugin versions.`
        ),
      throwRefetchErrors: Joi.boolean()
        .default(false)
        .description(
          `When this is set to true, errors thrown while updating data in gatsby develop will fail the build process instead of automatically attempting to recover.`
        ),
      graphql: Joi.object({
        showQueryVarsOnError: Joi.boolean()
          .default(false)
          .description(
            `When a GraphQL error is returned and the process exits, this plugin option determines wether or not to log out the query vars that were used in the query that returned GraphQL errors.`
          ),
        showQueryOnError: Joi.boolean().default(false),
        copyQueryOnError: Joi.boolean().default(false),
        panicOnError: Joi.boolean()
          .default(false)
          .description(
            `Determines wether or not to panic when any GraphQL error is returned. Default is false because sometimes non-critical errors are returned alongside valid data.`
          ),
        onlyReportCriticalErrors: Joi.boolean()
          .default(true)
          .description(
            `Determines wether or not to log non-critical errors. A non-critical error is any error which is returned alongside valid data. In previous versions of WPGraphQL this was very noisy because trying to access an entity that was private returned errors. Default is true.`
          ),
        copyNodeSourcingQueryAndExit: Joi.string()
          .allow(false)
          .default(false)
          .description(
            `When a type name from the remote schema is entered here, the node sourcing query will be copied to the clipboard, and the process will exit.`
          ),
        writeQueriesToDisk: Joi.boolean()
          .default(false)
          .description(
            `When true, all internal GraphQL queries generated during node sourcing will be written out to ./WordPress/GraphQL/[TypeName]/*.graphql for every type that is sourced. This is very useful for debugging GraphQL errors.`
          ),
      }),
    }).description(`Options related to debugging.`),
    production: Joi.object({
      hardCacheMediaFiles: Joi.boolean()
        .default(false)
        .description(
          `This option is experimental. When set to true, media files will be hard-cached outside the Gatsby cache at ./.wordpress-cache/path/to/media/file.jpeg. This is useful for preventing media files from being re-downloaded when the Gatsby cache automatically clears. When using this option, be sure to gitignore the wordpress-cache directory in the root of your project.`
        ),
    }),
    develop: Joi.object({
      nodeUpdateInterval: Joi.number()
        .integer()
        .default(300)
        .description(
          `Specifies in milliseconds how often Gatsby will ask WP if data has changed during development. If you want to see data update in near-realtime while you're developing, set this low. Your server may have trouble responding to too many requests over a long period of time and in that case, set this high. Setting it higher saves electricity too ⚡️🌲`
        ),
      hardCacheMediaFiles: Joi.boolean()
        .default(false)
        .description(
          `This option is experimental. When set to true, media files will be hard-cached outside the Gatsby cache at ./.wordpress-cache/path/to/media/file.jpeg. This is useful for preventing media files from being re-downloaded when the Gatsby cache automatically clears. When using this option, be sure to gitignore the wordpress-cache directory in the root of your project.`
        ),
      hardCacheData: Joi.boolean()
        .default(false)
        .description(
          `This option is experimental. When set to true, WordPress data will be hard-cached outside the Gatsby cache in ./.wordpress-cache/caches. This is useful for preventing the need to re-fetch all data when the Gatsby cache automatically clears. This hard cache will automatically clear itself when your remote WPGraphQL schema changes, or when you change your plugin options. When using this option, be sure to gitignore the wordpress-cache directory in the root of your project.`
        ),
    }).description(`Options related to the gatsby develop process.`),
    auth: Joi.object({
      htaccess: Joi.object({
        username: Joi.string()
          .allow(null)
          .default(null)
          .description(`The username for your .htpassword protected site.`),
        password: Joi.string()
          .allow(null)
          .default(null)
          .description(`The password for your .htpassword protected site.`),
      }).description(`Options related to htaccess authentication.`),
    }).description(`Options related to htaccess authentication.`),
    schema: Joi.object({
      queryDepth: Joi.number()
        .integer()
        .positive()
        .default(15)
        .description(
          `The maximum field depth the remote schema will be queried to.`
        ),
      circularQueryLimit: Joi.number()
        .integer()
        .positive()
        .default(5)
        .description(
          `The maximum number times a type can appear as it's own descendant.`
        ),
      typePrefix: Joi.string()
        .default(`Wp`)
        .description(
          `The prefix for all ingested types from the remote schema. For example Post becomes WpPost.`
        ),
      timeout: Joi.number()
        .integer()
        .default(30 * 1000)
        .description(
          `The amount of time in ms before GraphQL requests will time out.`
        ),
      perPage: Joi.number()
        .integer()
        .default(100)
        .description(
          `The number of nodes to fetch per page during node sourcing.`
        ),
    }).description(
      `Options related to fetching and ingesting the remote schema.`
    ),
    excludeFieldNames: Joi.array()
      .items(Joi.string())
      .allow(null)
      .description(
        `A list of field names to globally exclude from the ingested schema.`
      ),
    html: Joi.object({
      useGatsbyImage: Joi.boolean()
        .default(true)
        .allow(null)
        .description(
          `Causes the source plugin to find/replace images in html with Gatsby images.`
        ),
      imageMaxWidth: Joi.number()
        .integer()
        .allow(null)
        .default(null)
        .description(
          `Adds a limit to the max width an image can be. If the image size selected in WP is smaller or the image file width is smaller than this those values will be used instead.`
        ),
      fallbackImageMaxWidth: Joi.number()
        .integer()
        .allow(null)
        .default(100)
        .description(
          `If a max width can't be inferred from html this value will be passed to Sharp. If the image is smaller than this, the image file's width will be used instead.`
        ),
      imageQuality: Joi.number()
        .integer()
        .default(90)
        .allow(null)
        .description(
          `Determines the image quality that Sharp will use when generating inline html image thumbnails.`
        ),
      createStaticFiles: Joi.boolean()
        .default(true)
        .allow(null)
        .description(
          `When this is true, any url's which are wrapped in "", '', or () and which contain /wp-content/uploads will be transformed into static files and the url's will be rewritten. This adds support for video, audio, and anchor tags which point at WP media item uploads as well as inline-html css like background-image: url().`
        ),
    }).description(`Options related to html field processing.`),
    type: Joi.object({
      __all: getTypeOptions().description(
        `A special type setting which is applied to all types in the ingested schema.`
      ),
      RootQuery: getTypeOptions().append({
        excludeFieldNames: Joi.array()
          .items(Joi.string())
          .allow(null)
          .default([`viewer`, `node`, `schemaMd5`])
          .description(`Excludes fields on a type by field name.`),
      }),
      MediaItem: Joi.object({
        lazyNodes: Joi.boolean()
          .default(false)
          .description(
            `Enables a different media item sourcing strategy. Instead of fetching Media Items that are referenced by other nodes, Media Items will be fetched in connection resolvers from other nodes. This may be desireable if you're not using all of the connected images in your WP instance. This is not currently recommended because it messes up cli output and can be slow due to query running concurrency.`
          ),
        localFile: Joi.object({
          excludeByMimeTypes: Joi.array()
            .items(Joi.string())
            .default([])
            .description(
              `Allows preventing the download of files associated with MediaItem nodes by their mime types.`
            ),
          maxFileSizeBytes: Joi.number()
            .integer()
            .default(15728640)
            .description(
              `Allows preventing the download of files that are above a certain file size (in bytes).`
            ),
        }),
      }),
    })
      .pattern(Joi.string(), getTypeOptions())
      .description(`Options related to specific types in the remote schema.`),
  })
}
