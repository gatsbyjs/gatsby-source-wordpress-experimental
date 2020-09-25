import { createContentDigest } from "gatsby-core-utils"
import { introspectionQuery } from "gatsby-source-wordpress-experimental/utils/graphql-queries"
import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"
import sortBy from "lodash/sortBy"

describe(`[gatsby-source-wordpress-experimental] schema integrity`, () => {
  it(`hasn't altered the remote WPGraphQL schema`, async () => {
    const result = await fetchGraphql({
      query: introspectionQuery,
      url: process.env.WPGRAPHQL_URL,
    })

    const remoteWPGQLTypeNamesWithFieldNames = sortBy(
      result.data.__schema.types.map(type => ({
        name: type.name,
        fields:
          type && type.fields ? type.fields.map(field => field.name) : null,
      })),
      [`name`]
    )

    expect(remoteWPGQLTypeNamesWithFieldNames).toMatchSnapshot()
  })

  it(`hasn't altered the local Gatsby schema`, async () => {
    const result = await fetchGraphql({
      url: `http://localhost:8000/___graphql`,
      query: introspectionQuery,
    })

    const localWPTypeNamesWithFieldNames = sortBy(
      result.data.__schema.types
        .filter(({ name }) => name.startsWith(`Wp`))
        .map(type => ({
          name: type.name,
          fields:
            type && type.fields ? type.fields.map(field => field.name) : null,
        })),
      [`name`]
    )

    expect(localWPTypeNamesWithFieldNames).toMatchSnapshot()
  })
})
