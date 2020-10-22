/**
 * @jest-environment node
 */

import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"
import { incrementalIt } from "../../../test-utils/incremental-it"
import { testResolvedData } from "../../../test-utils/test-resolved-data"
import { queries } from "../../../test-utils/queries"
import { authedWPGQLRequest } from "../../../test-utils/authed-wpgql-request"

jest.setTimeout(100000)

const url = `http://localhost:8000/___graphql`

describe(`[gatsby-source-wordpress-experimental] data resolution`, () => {
  it(`resolves correct number of nodes`, async () => {
    const { data } = await fetchGraphql({
      url,
      query: queries.nodeCounts,
    })

    expect(data[`allWpMediaItem`].nodes).toBeTruthy()
    expect(data[`allWpMediaItem`].nodes).toMatchSnapshot()
    expect(data[`allWpMediaItem`].totalCount).toBe(36)

    expect(data[`allWpTag`].totalCount).toBe(5)
    expect(data[`allWpUser`].totalCount).toBe(1)
    expect(data[`allWpPage`].totalCount).toBe(20)
    expect(data[`allWpPost`].totalCount).toBe(10)
    expect(data[`allWpComment`].totalCount).toBe(1)
    expect(data[`allWpProject`].totalCount).toBe(1)
    expect(data[`allWpTaxonomy`].totalCount).toBe(3)
    expect(data[`allWpCategory`].totalCount).toBe(9)
    expect(data[`allWpMenu`].totalCount).toBe(1)
    expect(data[`allWpMenuItem`].totalCount).toBe(4)
    expect(data[`allWpTeamMember`].totalCount).toBe(1)
    expect(data[`allWpPostFormat`].totalCount).toBe(0)
    expect(data[`allWpContentType`].totalCount).toBe(8)
  })

  testResolvedData({
    url,
    title: `resolves wp-graphql-acf data`,
    gatsbyQuery: queries.acfData,
    queryReplace: {
      from: `wpPage(title: { eq: "ACF Field Test" }) {`,
      to: `page(id: "cG9zdDo3NjQ2") {`,
    },
    fields: {
      gatsby: `wpPage`,
      wpgql: `page`,
    },
  })

  // testResolvedData({
  //   url,
  //   title: `resolves wp-graphql-gutenberg columns`,
  //   gatsbyQuery: queries.gutenbergColumns,
  //   queryReplace: {
  //     from: `wpPost(title: { eq: "Gutenberg: Columns" }) {`,
  //     to: `post(id: "cG9zdDoxMjg=") {`,
  //   },
  //   fields: {
  //     gatsby: `wpPost`,
  //     wpgql: `post`,
  //   },
  // })

  // testResolvedData({
  //   url,
  //   title: `resolves wp-graphql-gutenberg layout elements`,
  //   gatsbyQuery: queries.gutenbergLayoutElements,
  //   queryReplace: {
  //     from: `wpPost(id: { eq: "cG9zdDoxMjU=" }) {`,
  //     to: `post(id: "cG9zdDoxMjU=") {`,
  //   },
  //   fields: {
  //     gatsby: `wpPost`,
  //     wpgql: `post`,
  //   },
  // })

  // testResolvedData({
  //   url,
  //   title: `resolves wp-graphql-gutenberg formatting blocks`,
  //   gatsbyQuery: queries.gutenbergFormattingBlocks,
  //   queryReplace: {
  //     from: `wpPost(id: { eq: "cG9zdDoxMjI=" }) {`,
  //     to: `post(id: "cG9zdDoxMjI=") {`,
  //   },
  //   fields: {
  //     gatsby: `wpPost`,
  //     wpgql: `post`,
  //   },
  // })

  // testResolvedData({
  //   url,
  //   title: `resolves wp-graphql-gutenberg common blocks`,
  //   gatsbyQuery: queries.gutenbergCommonBlocks,
  //   queryReplace: {
  //     from: `wpPost(id: { eq: "cG9zdDo5NA==" }) {`,
  //     to: `post(id: "cG9zdDo5NA==") {`,
  //   },
  //   fields: {
  //     gatsby: `wpPost`,
  //     wpgql: `post`,
  //   },
  // })

  it.skip(`resolves Yoast SEO data`, async () => {
    const gatsbyResult = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          wp {
            ${queries.yoastRootFields}
          }
          wpPage(title: {eq: "Yoast SEO"}) {
            ${queries.pageYoastFields}
          }
        }
      `,
    })

    const WPGraphQLData = await authedWPGQLRequest(/* GraphQL */ `
      {
        ${queries.yoastRootFields}
        page(id: "cG9zdDo3ODY4") {
          ${queries.pageYoastFields}
        }
      }
    `)

    const wpGraphQLPageNormalizedPaths = JSON.parse(
      JSON.stringify(WPGraphQLData.page).replace(
        /https:\/\/localhost:8001/gm,
        ``
      )
    )

    expect(gatsbyResult.data.wpPage).toStrictEqual(wpGraphQLPageNormalizedPaths)
    expect(gatsbyResult.data.wp.seo).toStrictEqual(WPGraphQLData.seo)
  })

  it(`resolves hierarchichal categories`, async () => {
    const gatsbyResult = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        fragment NestedCats on WpCategory {
          name
          wpChildren {
            nodes {
              name
              wpChildren {
                nodes {
                  name
                  wpChildren {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
        }

        {
          allWpCategory {
            nodes {
              name
            }
          }
          wpPost(id: { eq: "cG9zdDo5MzYx" }) {
            id
            title
            categories {
              nodes {
                ...NestedCats
              }
            }
          }
        }
      `,
    })

    const categoryNodes = gatsbyResult.data.allWpCategory.nodes
    const categoryNames = categoryNodes.map(({ name }) => name)

    expect(categoryNames.includes(`h1`)).toBeTruthy()
    expect(categoryNames.includes(`h2`)).toBeTruthy()
    expect(categoryNames.includes(`h3`)).toBeTruthy()
    expect(categoryNames.includes(`h4`)).toBeTruthy()
  })

  incrementalIt(`resolves menus`, async () => {
    const result = await fetchGraphql({
      url,
      query: queries.menus,
    })

    expect(result).toMatchSnapshot()
  })

  incrementalIt(`resolves pages`, async () => {
    const result = await fetchGraphql({
      url,
      query: queries.pages,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testPage.title).toEqual(
      process.env.WPGQL_INCREMENT ? `Sample Page DELTA SYNC` : `Sample Page`
    )
  })

  incrementalIt(`resolves posts`, async () => {
    const result = await fetchGraphql({
      url,
      query: queries.posts,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testPost.title).toEqual(
      process.env.WPGQL_INCREMENT ? `Hello world! DELTA SYNC` : `Hello world!`
    )
  })

  incrementalIt(`resolves users`, async () => {
    const result = await fetchGraphql({
      url,
      query: queries.users,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testUser.firstName).toEqual(
      process.env.WPGQL_INCREMENT ? `Tyler DELTA SYNC` : `Tyler`
    )
  })

  incrementalIt(`resolves root fields`, async () => {
    const result = await fetchGraphql({
      url,
      query: queries.rootFields,
    })

    expect(result).toMatchSnapshot()
  })
})
