import url from "url"

import fetchGraphql from "~/utils/fetch-graphql"

import { formatLogMessage } from "~/utils/format-log-message"

import { getPluginOptions } from "~/utils/get-gatsby-api"

import {
  supportedWpPluginVersions,
  genericDownloadMessage,
} from "~/supported-remote-plugin-versions"
import fetch from "node-fetch"

const areRemotePluginVersionsSatisfied = async ({
  helpers,
  url: wpGraphQLEndpoint,
}) => {
  let wpgqlIsSatisfied
  let wpGatsbyIsSatisfied

  try {
    const { data } = await fetchGraphql({
      query: /* GraphQL */ `
        query WPGatsbyCompatibility(
          $wpgqlVersion: String!
          $wpgatsbyVersion: String!
        ) {
          wpGatsbyCompatibility(
            wpGatsbyVersionRange: $wpgatsbyVersion
            wpGQLVersionRange: $wpgqlVersion
          ) {
            satisfies {
              wpGQL
              wpGatsby
            }
          }
        }
      `,
      variables: {
        wpgqlVersion: supportedWpPluginVersions.WPGraphQL.version,
        wpgatsbyVersion: supportedWpPluginVersions.WPGatsby.version,
      },
      panicOnError: false,
      throwGqlErrors: true,
    })

    wpgqlIsSatisfied = data.wpGatsbyCompatibility.satisfies.wpGQL
    wpGatsbyIsSatisfied = data.wpGatsbyCompatibility.satisfies.wpGatsby
  } catch (e) {
    if (
      e.message.includes(
        `Cannot query field "wpGatsbyCompatibility" on type "RootQuery".`
      )
    ) {
      helpers.reporter.panic(
        formatLogMessage(
          `Your version of WPGatsby is too old to determine if we're compatible.${genericDownloadMessage}`
        )
      )
    } else {
      helpers.reporter.panic(e.message)
    }
  }

  const shouldDisplayWPGraphQLReason =
    !wpgqlIsSatisfied && supportedWpPluginVersions.WPGraphQL.reason

  const shouldDisplayWPGatsbyReason =
    !wpGatsbyIsSatisfied && supportedWpPluginVersions.WPGatsby.reason

  const shouldDisplayAtleastOneReason =
    shouldDisplayWPGraphQLReason || shouldDisplayWPGatsbyReason

  const shouldDisplayBothReasons =
    shouldDisplayWPGraphQLReason && shouldDisplayWPGatsbyReason

  // a message explaining why these are the minimum versions
  const reasons = `${shouldDisplayAtleastOneReason ? `\n\nReasons:\n\n` : ``}${
    shouldDisplayWPGraphQLReason
      ? `- ${supportedWpPluginVersions.WPGraphQL.reason}`
      : ``
  }${shouldDisplayBothReasons ? `\n\n` : ``}${
    shouldDisplayWPGatsbyReason
      ? `- ${supportedWpPluginVersions.WPGatsby.reason}`
      : ``
  }`

  let message

  if (!wpgqlIsSatisfied && wpGatsbyIsSatisfied) {
    message = `Your remote version of WPGraphQL is not within the accepted range (${supportedWpPluginVersions.WPGraphQL.version}).

\tDownload v ${supportedWpPluginVersions.WPGraphQL.version} at https://github.com/wp-graphql/wp-graphql/releases

\tIf you're upgrading from an earlier version, read the release notes for each version between your old and new versions to determine which breaking changes you might encounter based on your use of the schema.
${reasons}
`
  }

  if (!wpGatsbyIsSatisfied) {
    const { hostname, protocol } = url.parse(wpGraphQLEndpoint)

    message = `Your remote version of WPGatsby is not within the accepted range (${supportedWpPluginVersions.WPGatsby.version})

\tDownload v ${supportedWpPluginVersions.WPGatsby.version} at https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins or update via ${protocol}//${hostname}/wp-admin/plugins.php
${reasons}`
  }

  if (!wpGatsbyIsSatisfied && !wpgqlIsSatisfied) {
    message = `WPGatsby and WPGraphQL are both outside the accepted version ranges.
visit https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins to download the latest versions.
${reasons}`
  }

  if (message) {
    helpers.reporter.panic(formatLogMessage(message))
  }
}

// This blank request is used to find debug messages
// when a graphql request is made with no query
// for example if 2 root fields are registered with the fieldname "products"
// this will throw a helpful error message explaining that one should be removed
const blankGetRequest = async ({ url, helpers }) =>
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      if (json?.errors?.length) {
        const firstError = json.errors[0]

        if (firstError.debugMessage) {
          helpers.reporter.panic(
            formatLogMessage(`WPGraphQL returned a debug message on startup:

${firstError.debugMessage}
          `)
          )
        }
      }
    })
    .catch((e) => {})

const isWpGatsby = async () =>
  fetchGraphql({
    query: /* GraphQL */ `
      {
        isWpGatsby
      }
    `,
    errorMap: {
      from: `Cannot query field "isWpGatsby" on type "RootQuery".`,
      // @todo replace this link with another once we're out of alpha
      to: `WPGatsby is not active in your WordPress installation.\nTo download the latest versions of WPGatsby and WPGraphL, visit:\nhttps://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/tree/master/WordPress/plugins`,
    },
    panicOnError: true,
    isFirstRequest: true,
  })

const ensurePluginRequirementsAreMet = async (helpers, _pluginOptions) => {
  if (helpers.traceId === `refresh-createSchemaCustomization`) {
    return
  }

  const {
    url,
    debug: { disableCompatibilityCheck },
  } = getPluginOptions()

  console.log("blank request")
  await blankGetRequest({ url, helpers })
  console.log(`blank request succeeded`)

  await isWpGatsby()

  if (!disableCompatibilityCheck) {
    await areRemotePluginVersionsSatisfied({ helpers, url })
  }
}

export { ensurePluginRequirementsAreMet }
