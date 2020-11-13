import { testPluginOptionsSchema } from "gatsby-plugin-utils"
import { pluginOptionsSchema } from "../../../../plugin/src/steps/declare-plugin-options-schema"

describe(`pluginOptionsSchema`, () => {
  it(`should validate a minimal, valid config`, async () => {
    const { isValid } = await testPluginOptionsSchema(pluginOptionsSchema, {
      url: `http://localhost:8000/graphql`,
    })

    expect(isValid).toEqual(true)
  })

  it(`should invalidate a config missing required vars`, async () => {
    const { isValid, errors } = await testPluginOptionsSchema(
      pluginOptionsSchema,
      {}
    )

    expect(isValid).toEqual(false)
    expect(errors).toMatchInlineSnapshot(`
      Array [
        "\\"url\\" is required",
      ]
    `)
  })

  it(`should validate a fully custom config`, async () => {
    const { isValid, errors } = await testPluginOptionsSchema(
      pluginOptionsSchema,
      {
        url: `http://fake:8000/graphql`,
        auth: {
          htaccess: {
            username: `test`,
            password: `test`,
          },
        },
        verbose: true,
        excludeFieldNames: [`commentCount`, `commentCount`],
        schema: {
          queryDepth: 5,
          typePrefix: `Wp`,
        },
        develop: {
          nodeUpdateInterval: 3000,
        },
        debug: {
          graphql: {
            showQueryOnError: true,
            showQueryVarsOnError: false,
            copyQueryOnError: true,
            panicOnError: false,
            // a critical error is a WPGraphQL query that returns an error and response data. Currently WPGQL will error if we try to access private posts so if this is false it returns a lot of irrelevant errors.
            onlyReportCriticalErrors: true,
            writeQueriesToDisk: true,
          },
        },
        type: {
          TypeLimitTest: {
            limit: 1,
          },
          TypeLimit0Test: {
            limit: 0,
          },
          Comment: {
            excludeFieldNames: [`databaseId`],
          },
          Page: {
            excludeFieldNames: [`enclosure`],
          },
          DatabaseIdentifier: {
            exclude: true,
          },
          User: {
            excludeFieldNames: [
              `extraCapabilities`,
              `capKey`,
              `email`,
              `registeredDate`,
            ],
          },
          Post: {
            limit:
              process.env.NODE_ENV === `development`
                ? // Lets just pull 50 posts in development to make it easy on ourselves.
                  50
                : // and we don't actually need more than 1000 in production
                  1000,
          },
          MediaItem: {
            localFile: {
              maxFileSizeBytes: 10485760,
            },
          },
        },
      }
    )

    expect(errors).toEqual([])
    expect(isValid).toEqual(true)
  })
})
