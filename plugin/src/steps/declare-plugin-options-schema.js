export function declarePluginOptionsSchema({ Joi }) {
  return Joi.object({
    url: Joi.string(),
    verbose: Joi.boolean().default(true),
    debug: Joi.object({
      throwRefetchErrors: Joi.boolean().default(false),
      graphql: Joi.object({
        showQueryOnError: Joi.boolean().default(false),
        showQueryVarsOnError: Joi.boolean().default(false),
        copyQueryOnError: Joi.boolean().default(false),
        panicOnError: Joi.boolean().default(false),
        onlyReportCriticalErrors: Joi.boolean().default(false),
        copyNodeSourcingQueryAndExit: Joi.boolean().default(false),
        writeQueriesToDisk: Joi.boolean().default(false),
      }),
      timeBuildSteps: Joi.boolean().default(false),
      disableCompatibilityCheck: Joi.boolean().default(false),
    }),
    develop: Joi.object({
      nodeUpdateInterval: Joi.number().integer().default(300),
      hardCacheMediaFiles: Joi.boolean().default(false),
      hardCacheData: Joi.boolean().default(false),
    }),
    auth: Joi.object({
      htaccess: Joi.object({
        username: Joi.string(),
        password: Joi.string(),
      }),
    }),
    schema: Joi.object({
      typePrefix: Joi.string().default(`Wp`),
      timeout: Joi.number()
        .integer()
        .default(30 * 1000),
      perPage: Joi.number().integer().default(100),
      queryDepth: Joi.number().integer().default(15),
      circularQueryLimit: Joi.number().integer().default(5),
    }),
    excludeFieldNames: Joi.array().items(Joi.string()),
    html: Joi.object({
      useGatsbyImage: Joi.boolean().default(true),
      imageMaxWidth: Joi.number().integer(),
      fallbackImageMaxWidth: Joi.number().integer().default(100),
      imageQuality: Joi.number().integer().default(90),
      createStaticFiles: Joi.boolean().default(true),
    }),
    type: Joi.object().custom((value, helpers) => {
      const reservedKeys = [`MediaItem`]
      const dynamicKeys = Object.keys(value).filter(
        (k) => !reservedKeys.includes(k)
      )

      const baseSchema = Joi.object({
        nodeInterface: Joi.boolean(),
        exclude: Joi.boolean(),
        excludeFieldNames: Joi.array().items(Joi.string()),
        beforeChangeNode: Joi.function().arity(1),
      })

      Joi.assert(
        value.MediaItem,
        baseSchema.append({
          lazyNodes: Joi.boolean().default(false),
          exclude: Joi.boolean().valid(false),
          localFile: Joi.object({
            excludeByMimeTypes: Joi.array().items(Joi.string()),
          }),
        }),
        `type.MediaItem`
      )

      dynamicKeys.forEach((k) => {
        Joi.assert(value[k], baseSchema, `type.${k}`)
      })
    }),
  })
}
