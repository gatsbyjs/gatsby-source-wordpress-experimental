import url from "url"
import Range from "semver/classes/range"

import fetchGraphql from "~/utils/fetch-graphql"

import { formatLogMessage } from "~/utils/format-log-message"

import { getPluginOptions } from "~/utils/get-gatsby-api"

import {
  supportedWpPluginVersions,
  genericDownloadMessage,
} from "~/supported-remote-plugin-versions"
import fetch from "node-fetch"

const parseRange = (range) => {
  const {
    set: [versions],
  } = new Range(range)

  const isARange = versions.length >= 2
  const minVersion = versions[0].semver.version
  const maxVersion = versions[1]?.semver?.version

  let message
  if (isARange) {
    message = `Install a version between ${minVersion} and ${maxVersion}.`
  } else {
    message = `Install version ${minVersion}.`
  }

  return {
    message,
    minVersion,
    maxVersion,
    isARange,
  }
}

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

  let message = ``

  if (!wpgqlIsSatisfied) {
    const { message: rangeMessage, minVersion, maxVersion } = parseRange(
      supportedWpPluginVersions.WPGraphQL.version
    )

    message += `Your remote version of WPGraphQL is not within the accepted range (${
      supportedWpPluginVersions.WPGraphQL.version
    }).

${rangeMessage}

If the version of WPGraphQL in your WordPress instance is lower than ${minVersion}
it means you need to upgrade your version of WPGraphQL.

If the version of WPGraphQL in your WordPress instance is higher than ${
      maxVersion || minVersion
    }
it may mean you need to upgrade your version of gatsby-source-wordpress.

You can find a matching WPGraphQL version at https://github.com/wp-graphql/wp-graphql/releases`
  }

  if (!wpGatsbyIsSatisfied && !wpgqlIsSatisfied) {
    message += `\n\n---------------\n\n`
  }

  if (!wpGatsbyIsSatisfied) {
    const { message: rangeMessage, minVersion, maxVersion } = parseRange(
      supportedWpPluginVersions.WPGatsby.version
    )

    const { hostname, protocol } = url.parse(wpGraphQLEndpoint)

    message += `Your remote version of WPGatsby is not within the accepted range (${
      supportedWpPluginVersions.WPGatsby.version
    })

${rangeMessage}

If the version of WPGatsby in your WordPress instance is lower than ${minVersion}
it means you need to upgrade your version of WPGatsby.

If the version of WPGatsby in your WordPress instance is higher than ${
      maxVersion || minVersion
    }
it may mean you need to upgrade your version of gatsby-source-wordpress.

Download a matching version at https://github.com/gatsbyjs/wp-gatsby/releases
or update via ${protocol}//${hostname}/wp-admin/plugins.php`
  }

  if (!wpGatsbyIsSatisfied || !wpgqlIsSatisfied) {
    message += `
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

const prettyPermalinksAreEnabled = async ({ helpers }) => {
  try {
    const { data } = await fetchGraphql({
      query: /* GraphQL */ `
        {
          generalSettings {
            url
          }
          wpGatsby {
            arePrettyPermalinksEnabled
          }
        }
      `,
      throwGqlErrors: true,
    })

    if (!data.wpGatsby.arePrettyPermalinksEnabled) {
      helpers.reporter.log(``)
      helpers.reporter.warn(
        formatLogMessage(`
Pretty permalinks are not enabled in your WordPress instance.
Gatsby routing requires this setting to function properly.
Please enable pretty permalinks by changing your settings at
${data.generalSettings.url}/wp-admin/options-permalink.php.
`)
      )
    }
  } catch (e) {
    // the WPGatsby version is too old to query for wpGatsby.arePrettyPermalinksEnabled
  }
}

const ensurePluginRequirementsAreMet = async (helpers, _pluginOptions) => {
  if (helpers.traceId === `refresh-createSchemaCustomization`) {
    return
  }

  const {
    url,
    debug: { disableCompatibilityCheck },
  } = getPluginOptions()

  await blankGetRequest({ url, helpers })

  await isWpGatsby()
  await prettyPermalinksAreEnabled({ helpers })

  if (!disableCompatibilityCheck) {
    await areRemotePluginVersionsSatisfied({ helpers, url })
  }
}

export { ensurePluginRequirementsAreMet }
