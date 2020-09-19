import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"

export const testResolvedData = ({
  url,
  title,
  gatsbyQuery,
  queryReplace: { from, to },
}) => {
  it(title, async () => {
    const gatsbyResult = await fetchGraphql({
      url,
      query: gatsbyQuery,
    })

    const wpGraphQLQuery = gatsbyQuery.replace(/Wp/gm, ``).replace(from, to)

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: wpGraphQLQuery,
    })

    expect(WPGraphQLResult.data.page).toStrictEqual(gatsbyResult.data.wpPage)
  })
}
