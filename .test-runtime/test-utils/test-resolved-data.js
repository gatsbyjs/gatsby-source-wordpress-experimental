import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"

const normalizeResponse = data =>
  JSON.parse(
    JSON.stringify(data).replace(/https:\/\/gatsbyinttests.wpengine.com/gm, ``)
  )

export const testResolvedData = ({
  url,
  title,
  gatsbyQuery,
  queryReplace: { from, to },
  variables = {},
  fields: { gatsby, wpgql },
}) => {
  it(title, async () => {
    const gatsbyResult = await fetchGraphql({
      url,
      query: gatsbyQuery,
      variables,
    })

    const wpGraphQLQuery = gatsbyQuery
      .replace(/Wp/gm, ``)
      .replace(from, to)
      .replace(`$id: String!`, `$id: ID!`)

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: wpGraphQLQuery,
      variables,
    })

    const wpgqlNode = normalizeResponse(WPGraphQLResult.data[wpgql])
    expect(wpgqlNode).toBeTruthy()

    const gatsbyNode = normalizeResponse(gatsbyResult.data[gatsby])
    console.log(gatsbyNode)
    expect(gatsbyNode).toBeTruthy()

    expect(wpgqlNode).toStrictEqual(gatsbyNode)
  })
}
