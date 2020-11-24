import prettier from "prettier"
import axios from "axios"
import rateLimit from "axios-rate-limit"
import { bold } from "chalk"
import { formatLogMessage } from "./format-log-message"
import store from "~/store"
import { getPluginOptions } from "./get-gatsby-api"
import urlUtil from "url"
import { CODES } from "./report"

let http = null

const getHttp = (limit = 50) => {
  if (!http) {
    http = rateLimit(axios.create(), {
      maxRPS: limit,
    })
  }
  return http
}

const handleErrorOptions = async ({
  variables,
  query,
  pluginOptions,
  reporter,
}) => {
  if (
    variables &&
    Object.keys(variables).length &&
    pluginOptions.debug.graphql.showQueryVarsOnError
  ) {
    reporter.info(
      formatLogMessage(`GraphQL vars: ${JSON.stringify(variables)}`)
    )
  }

  try {
    query = prettier.format(query, { parser: `graphql` })
  } catch (e) {
    // do nothing
  }

  if (pluginOptions.debug.graphql.showQueryOnError) {
    reporter.error(formatLogMessage(`GraphQL query: ${query}`))
  }

  if (pluginOptions.debug.graphql.copyQueryOnError) {
    try {
      await clipboardy.write(query)
    } catch (e) {
      // do nothing
    }
  }
}

const handleErrors = async ({
  variables,
  query,
  pluginOptions,
  reporter,
  responseJSON,
  panicOnError,
  errorContext,
}) => {
  await handleErrorOptions({
    variables,
    query,
    pluginOptions,
    reporter,
  })

  if (!responseJSON) {
    return
  }

  if (
    !responseJSON.data ||
    panicOnError ||
    pluginOptions.debug.graphql.panicOnError
  ) {
    reporter.panic({
      context: {
        sourceMessage: formatLogMessage(
          errorContext || `Encountered errors. See above for details.`
        ),
      },
    })
  }
}

const handleGraphQLErrors = async ({
  query,
  variables,
  response,
  errorMap,
  panicOnError,
  reporter,
  errorContext,
  forceReportCriticalErrors = false,
}) => {
  const pluginOptions = getPluginOptions()

  const json = response.data
  const { errors } = json

  if (!errors) {
    return
  }

  // if we have json data, the error wasn't critical.
  if (
    json &&
    json.data &&
    pluginOptions.debug.graphql.onlyReportCriticalErrors &&
    // only return if we're not force disabling this.
    // this is used when we make GraphQL requests intentionally rather than programmatically
    // for ex during the Preview process
    !forceReportCriticalErrors
  ) {
    return
  }

  for (const error of errors) {
    const errorWasMapped =
      errorMap &&
      errorMap.from &&
      errorMap.to &&
      error.message === errorMap.from

    if (errorWasMapped && panicOnError) {
      reporter.panic({
        id: CODES.RemoteGraphQLError,
        context: {
          sourceMessage: formatLogMessage(errorMap.to),
        },
      })
    } else if (errorWasMapped) {
      reporter.error({
        id: CODES.RemoteGraphQLError,
        context: {
          sourceMessage: formatLogMessage(errorMap.to),
        },
      })
    }

    // convert the error path array into a string like "mediaItems.nodes[55].mediaDetails.meta.focalLength"
    let errorPath = error?.path
      ?.map((field, index) => {
        // if this is a number it's the index of a node
        if (typeof field === `number`) {
          return `[${field}].`
        } else if (
          // otherwise if the next field isn't a number
          typeof error.path[index + 1] !== `number`
        ) {
          // add dot notation
          return `${field}.`
        }

        // or just return the field
        return field
      })
      ?.join(``)

    if (errorPath?.endsWith(`.`)) {
      // trim "." off the end of the errorPath
      errorPath = errorPath.slice(0, -1)
    }

    if (error.debugMessage) {
      reporter.error(
        formatLogMessage(
          `Error category: ${error.category} \n\nError: \n  ${error.message} \n\n Debug message: \n  ${error.debugMessage} \n\n Error path: ${errorPath}`
        )
      )
    } else {
      reporter.error(
        formatLogMessage(
          `(${error.category}) ${
            error?.locations?.length
              ? error.locations
                  .map(
                    (location) =>
                      `location: line ${location.line}, column: ${location.column}`
                  )
                  ?.join(`. `)
              : ``
          } \n\t ${
            error.message
          }  \n\n Error path: ${errorPath} \n\n If you haven't already, try adding ${bold(
            `define( 'GRAPHQL_DEBUG', true );`
          )} to your wp-config.php for more detailed error messages.`
        )
      )
    }
  }

  await handleErrors({
    responseJSON: json,
    variables,
    pluginOptions,
    reporter,
    query,
    panicOnError,
    errorContext,
  })
}

const ensureStatementsAreTrue = `${bold(
  `Please ensure the following statements are true`
)} \n  - your WordPress URL is correct in gatsby-config.js\n  - your server is responding to requests \n  - WPGraphQL and WPGatsby are installed in your WordPress backend`

// @todo add a link to docs page for debugging
const genericError = ({ url }) =>
  `GraphQL request to ${bold(url)} failed.\n\n${ensureStatementsAreTrue}`

const slackChannelSupportMessage = `If you're still having issues, please visit https://www.wpgraphql.com/community-and-support/\nand follow the link to join the WPGraphQL Slack.\nThere are a lot of folks there in the #gatsby channel who are happy to help with debugging.`

const handleFetchErrors = async ({
  e,
  reporter,
  url,
  timeout,
  variables,
  pluginOptions,
  query,
  response,
  errorContext,
  isFirstRequest,
  headers,
}) => {
  await handleErrors({
    panicOnError: false,
    reporter,
    variables,
    pluginOptions,
    query,
    errorContext,
  })

  if (e.message.includes(`timeout of ${timeout}ms exceeded`)) {
    reporter.error(e.message)
    reporter.panic({
      id: CODES.Timeout,
      context: {
        sourceMessage: formatLogMessage(
          `It took too long for ${url} to respond (longer than ${
            timeout / 1000
          } seconds).\n\nEither your URL is wrong, you need to increase server resources, or you need to decrease the amount of resources each request takes.\n\nYou can configure how much resources each request takes by lowering your \`options.schema.perPage\` value from the default of 100 nodes per request.\nAlternatively you can increase the request timeout by setting a value in milliseconds to \`options.schema.timeout\`, the current setting is ${timeout}.\n\n${genericError(
            { url }
          )}`,
          { useVerboseStyle: true }
        ),
      },
    })
  }
  if (e.message.includes(`Request failed with status code 50`)) {
    reporter.error(e)
    reporter.panic({
      id: CODES.WordPress500ishError,
      context: {
        sourceMessage: formatLogMessage(
          [
            `Your wordpress server at ${bold(url)} appears to be overloaded.`,
            `\nYou might try reducing the ${bold(
              `requestConcurrency`
            )} for content:`,
            `\n{
  resolve: 'gatsby-source-wordpress-experimental',
  options: {
    schema: {
      requestConcurrency: 25
    }
  },
}`,
          ],
          { useVerboseStyle: true }
        ),
      },
    })
  }

  const unauthorized = e.message.includes(`Request failed with status code 401`)

  const htaccessCredentials = pluginOptions.auth.htaccess

  const missingCredentials =
    !htaccessCredentials.password || !htaccessCredentials.username

  if (unauthorized && !missingCredentials) {
    reporter.panic({
      id: CODES.Authentication,
      context: {
        sourceMessage: formatLogMessage(
          `Request failed with status code 401.\n\nThe HTTP Basic Auth credentials you've provided in plugin options were rejected.\nDouble check that your credentials are correct.
         \n${genericError({ url })}`,
          { useVerboseStyle: true }
        ),
      },
    })
  } else if (unauthorized) {
    reporter.panic({
      id: CODES.Authentication,
      context: {
        sourceMessage: formatLogMessage(
          `Request failed with status code 401.\n\n Your WordPress instance may be protected with HTTP Basic authentication.\n If it is you will need to add the following to your plugin options:

        {
          resolve: \`gatsby-source-wordpress-experimental\`,
          options: {
            auth: {
              htaccess: {
                username: process.env.HTTPBASICAUTH_USERNAME,
                password: process.env.HTTPBASICAUTH_PASSWORD,
              }
            }
          }
        }
         \n${genericError({ url })}`,
          { useVerboseStyle: true }
        ),
      },
    })
  }

  const forbidden = e.message.includes(`Request failed with status code 403`)

  if (forbidden) {
    reporter.panic({
      id: CODES.RequestDenied,
      context: {
        sourceMessage: formatLogMessage(
          `${e.message}\n\nThe GraphQL request was forbidden.\nIf you are using a security plugin like WordFence or a server firewall you may need to whitelist your IP address or adjust your firewall settings for your GraphQL endpoint.\n\n${errorContext}`
        ),
      },
    })
  }

  const redirected = e.message.includes(`GraphQL request was redirected`)

  if (redirected) {
    await handleErrorOptions({ variables, query, pluginOptions, reporter })
    reporter.panic({
      id: CODES.WordPressFilters,
      context: {
        sourceMessage: formatLogMessage(
          `${e.message}\n\n${errorContext}\n\nThis can happen due to custom code or redirection plugins which redirect the request when a post is accessed.\nThis redirection code will need to be patched to not run during GraphQL requests.\n\nThat can be achieved by adding something like the following to your WP PHP code:\n
if ( defined( 'GRAPHQL_REQUEST' ) && true === GRAPHQL_REQUEST ) {
  return examplePreventRedirect();
}

${slackChannelSupportMessage}`
        ),
      },
    })
  }

  const responseReturnedHtml = response?.headers[`content-type`].includes(
    `text/html;`
  )
  const limit = pluginOptions?.schema?.requestConcurrency

  if (responseReturnedHtml && isFirstRequest) {
    const requestOptions = {
      timeout,
      headers,
    }

    if (!missingCredentials) {
      requestOptions.auth = htaccessCredentials
    }
    try {
      const urlWithoutTrailingSlash = url.replace(/\/$/, ``)

      const response = await getHttp(limit).post(
        [urlWithoutTrailingSlash, `/graphql`].join(``),
        { query, variables },
        requestOptions
      )

      const contentType = response?.headers[`content-type`]

      if (contentType?.includes(`application/json;`)) {
        const docsLink = `https://github.com/gatsbyjs/gatsby-source-wordpress-experimental/blob/master/docs/plugin-options.md#url-string`

        // if adding `/graphql` works, panic with a useful message
        reporter.panic({
          id: CODES.missingAppendedPath,
          context: {
            sourceMessage: formatLogMessage(
              `${
                errorContext ? `${errorContext}` : ``
              }\n\nThe supplied url ${bold(
                urlWithoutTrailingSlash
              )} is invalid,\nhowever ${bold(
                urlWithoutTrailingSlash + `/graphql`
              )} works!\n\nFor this plugin to consume the wp-graphql schema, you'll need to specify the full URL\n(${bold(
                urlWithoutTrailingSlash + `/graphql`
              )}) in your gatsby-config.\n\nYou can learn more about configuring the source plugin URL here:\n${docsLink}\n\n`
            ),
          },
        })
      }
    } catch (err) {
      // elsewise, continue to handle HTML response as normal
    }

    const copyHtmlResponseOnError =
      pluginOptions?.debug?.graphql?.copyHtmlResponseOnError

    if (copyHtmlResponseOnError) {
      try {
        clipboardy?.writeSync(response.data)
      } catch (e) {
        // do nothing
      }
    }

    reporter.panic({
      id: CODES.BadResponse,
      context: {
        sourceMessage: formatLogMessage(
          `${errorContext || ``}\n\n${
            e.message
          } \n\nReceived HTML as a response. Are you sure ${url} is the correct URL?\n\nIf that URL redirects to the correct URL via WordPress in the browser,\nor you've entered the wrong URL in settings,\nyou might receive this error.\nVisit that URL in your browser, and if it looks good, copy/paste it from your URL bar to your config.\n\n${ensureStatementsAreTrue}${
            copyHtmlResponseOnError
              ? `\n\nCopied HTML response to your clipboard.`
              : `\n\n${bold(
                  `Further debugging`
                )}\nIf you still receive this error after following the steps above, this may be a problem with your WordPress instance.\nA plugin or theme may be adding additional output for some posts or pages.\nAdd the following plugin option to copy the html response to your clipboard for debugging.\nYou can paste the response into an html file to see what's being returned.\n
{
  resolve: "gatsby-source-wordpress-experimental",
  options: {
    debug: {
      graphql: {
        copyHtmlResponseOnError: true
      }
    }
  }
}`
          }
        `,
          {
            useVerboseStyle: true,
          }
        ),
      },
    })
  } else if (responseReturnedHtml && !isFirstRequest) {
    reporter.panic({
      id: CODES.WordPressFilters,
      context: {
        sourceMessage: formatLogMessage(
          `${errorContext}\n\n${e.message}\n\nThere are some WordPress PHP filters in your site which are adding additional output to the GraphQL response.\nThese may have been added via custom code or via a plugin.\n\nYou will need to debug this and remove these filters during GraphQL requests using something like the following:
        
if ( defined( 'GRAPHQL_REQUEST' ) && true === GRAPHQL_REQUEST ) {
  return exampleReturnEarlyInFilter( $data );
}\n\nYou can use the gatsby-source-wordpress-experimental debug options to determine which GraphQL request is causing this error.\nhttps://github.com/gatsbyjs/gatsby-source-wordpress-experimental/blob/master/docs/plugin-options.md#debuggraphql-object\n\n${slackChannelSupportMessage}`
        ),
      },
    })
  }

  const sharedEmptyStringReponseError = `\n\nAn empty string was returned instead of a response when making a GraphQL request.\nThis may indicate that you have a WordPress filter running which is causing WPGraphQL\nto return an empty string instead of a response.\nPlease open an issue with a reproduction at\nhttps://github.com/gatsbyjs/gatsby-source-wordpress-experimental/issues/new\nfor more help\n\n${errorContext}\n`

  const emptyStringResponse =
    e.message === `GraphQL request returned an empty string.`

  if (emptyStringResponse) {
    reporter.log(``)
    if (process.env.NODE_ENV === `development`) {
      reporter.warn(formatLogMessage(sharedEmptyStringReponseError))
    } else {
      reporter.panic({
        context: {
          sourceMessage: formatLogMessage(sharedEmptyStringReponseError),
        },
      })
    }

    return
  }

  reporter.panic({
    context: {
      sourceMessage: formatLogMessage(
        `${e.message} ${
          errorContext ? `\n\n` + errorContext : ``
        }\n\n${genericError({ url })}`,
        {
          useVerboseStyle: true,
        }
      ),
    },
  })
}

const fetchGraphql = async ({
  query,
  errorMap,
  ignoreGraphQLErrors = false,
  panicOnError = false,
  throwGqlErrors = false,
  throwFetchErrors = false,
  url = false,
  variables = {},
  headers = {},
  errorContext = false,
  isFirstRequest = false,
  forceReportCriticalErrors = false,
}) => {
  const { helpers, pluginOptions } = store.getState().gatsbyApi
  const limit = pluginOptions?.schema?.requestConcurrency

  const { url: pluginOptionsUrl } = pluginOptions
  let { reporter } = helpers

  if (!reporter || typeof reporter === `undefined`) {
    reporter = {
      panic: (message) => {
        throw new Error(message.context.sourceMessage)
      },
      error: console.error,
    }
  }

  if (!url) {
    url = pluginOptionsUrl
  }

  const timeout = pluginOptions.schema.timeout

  const htaccessCredentials = pluginOptions.auth.htaccess

  const missingCredentials =
    !htaccessCredentials.password || !htaccessCredentials.username

  let response

  try {
    const requestOptions = {
      timeout,
      headers,
    }

    if (!missingCredentials) {
      requestOptions.auth = htaccessCredentials
    }

    response = await getHttp(limit).post(
      url,
      { query, variables },
      requestOptions
    )

    if (response.data === ``) {
      throw new Error(`GraphQL request returned an empty string.`)
    }

    const { path } = urlUtil.parse(url)
    const responsePath = response.request.path
    if (path !== responsePath && responsePath !== undefined) {
      throw new Error(`GraphQL request was redirected to ${responsePath}`)
    }

    const contentType = response.headers[`content-type`]

    if (!contentType.includes(`application/json;`)) {
      throw new Error(`Unable to connect to WPGraphQL.`)
    }
  } catch (e) {
    if (throwFetchErrors) {
      throw e
    }

    await handleFetchErrors({
      e,
      reporter,
      url,
      timeout,
      variables,
      pluginOptions,
      query,
      response,
      errorContext,
      isFirstRequest,
    })
  }

  if (throwGqlErrors && response.data.errors) {
    const stringifiedErrors = response.data.errors
      .map((error) => error.message)
      .join(`\n\n`)

    throw new Error(stringifiedErrors)
  }

  if (!ignoreGraphQLErrors) {
    await handleGraphQLErrors({
      query,
      variables,
      response,
      errorMap,
      panicOnError,
      reporter,
      url,
      timeout,
      errorContext,
      isFirstRequest,
      forceReportCriticalErrors,
    })
  }

  return response.data
}

export default fetchGraphql
