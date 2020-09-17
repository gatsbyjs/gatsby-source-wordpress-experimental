import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"
import { incrementalIt } from "../../../test-utils/incremental-it"

jest.setTimeout(100000)

const url = `http://localhost:8000/___graphql`

describe(`[gatsby-source-wordpress-experimental] data resolution`, () => {
  incrementalIt(`resolves correct number of nodes`, async () => {
    const { data } = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          allWpMenu {
            totalCount
          }
          allWpTag {
            totalCount
          }
          allWpUser {
            totalCount
          }
          allWpPage {
            totalCount
          }
          allWpPost {
            totalCount
          }
          allWpComment {
            totalCount
          }
          allWpProject {
            totalCount
          }
          allWpTaxonomy {
            totalCount
          }
          allWpCategory {
            totalCount
          }
          allWpUserRole {
            totalCount
          }
          allWpMenuItem {
            totalCount
          }
          allWpMediaItem {
            totalCount
          }
          allWpTeamMember {
            totalCount
          }
          allWpPostFormat {
            totalCount
          }
          allWpContentType {
            totalCount
          }
        }
      `,
    })

    expect(data[`allWpTag`].totalCount).toBe(5)
    expect(data[`allWpUser`].totalCount).toBe(1)
    expect(data[`allWpPage`].totalCount).toBe(7)
    expect(data[`allWpPost`].totalCount).toBe(9)
    expect(data[`allWpComment`].totalCount).toBe(1)
    expect(data[`allWpProject`].totalCount).toBe(1)
    expect(data[`allWpTaxonomy`].totalCount).toBe(3)
    expect(data[`allWpCategory`].totalCount).toBe(4)
    expect(data[`allWpUserRole`].totalCount).toBe(0)
    expect(data[`allWpMenu`].totalCount).toBe(1)
    expect(data[`allWpMenuItem`].totalCount).toBe(4)
    expect(data[`allWpMediaItem`].totalCount).toBe(10)
    expect(data[`allWpTeamMember`].totalCount).toBe(1)
    expect(data[`allWpPostFormat`].totalCount).toBe(0)
    expect(data[`allWpContentType`].totalCount).toBe(8)
  })

  it(`resolves wp-graphql-acf data`, async () => {
    const acfFields = /* GraphQL */ `
      acfPageFields {
        buttonGroupField
        checkboxField
        colorPickerField
        datePickerField
        dateTimePickerField
        fieldGroupName
        fileField {
          id
          title
        }
        galleryField {
          id
          title
        }
        googleMapField {
          city
          country
          countryShort
          latitude
          longitude
          placeId
          postCode
          state
          stateShort
          streetAddress
          streetName
          streetNumber
          zoom
        }
        groupField {
          fieldGroupName
        }
        imageField {
          id
          title
        }
        oembedField
        radioButtonField
        rangeField
        repeaterField {
          fieldGroupName
        }
        selectField
        textAreaField
        textField
        timePicker
        trueFalseField
        userField {
          id
          name
        }

        relationshipField {
          ... on WpPost {
            id
            title
          }
          ... on WpPage {
            id
            title
          }
        }
        postObjectField {
          ... on WpPost {
            id
            title
          }
          ... on WpPage {
            id
            title
          }
        }
        pageLinkField {
          ... on WpPage {
            id
            title
          }
          ... on WpPost {
            id
            title
          }
        }

        flexibleContentField {
          ... on WpPage_Acfpagefields_FlexibleContentField_FlexLayout1 {
            fieldGroupName
            flexImage {
              title
            }
            flexRelationship {
              ... on WpPost {
                title
              }
            }
            flexRepeater {
              fieldGroupName
              # https://github.com/wp-graphql/wp-graphql-acf/issues/165
              # flexRepeaterRelationship {
              #   ... on WpPost {
              #     id
              #     title
              #   }
              # }
              flexRepeaterTitle
            }
          }
        }
        repeaterField {
          repeaterFlex {
            ... on WpPage_Acfpagefields_repeaterField_RepeaterFlex_RepeaterFlexTitleLayout {
              repeaterFlexTitle
            }
            ... on WpPage_Acfpagefields_repeaterField_RepeaterFlex_RepeaterFlexRelationshipLayout {
              repeaterFlexRelationship {
                ... on WpPage {
                  title
                }
              }
            }
          }
        }
      }
    }
  `
    const gatsbyResult = await fetchGraphql({
      url,
      query: `
        {
          wpPage(title: { eq: "ACF Field Test" }) {
            ${acfFields}
        }
      `,
    })

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: `
        {
          page(id: "cG9zdDo3NjQ2") {
            ${acfFields.replace(/Wp/gm, ``)}
        }
      `,
    })

    expect(WPGraphQLResult.data.page).toStrictEqual(gatsbyResult.data.wpPage)
  })

  it(`resolves wp-graphql-gutenberg columns`, async () => {
    const gutenbergGatsbyQuery = /* GraphQL */ `
      fragment WpCoreColumnBlock on WpCoreColumnBlock {
        name
        isDynamic
        order
        originalContent
        parentNode {
          id
          ... on WpPost {
            title
          }
        }
        parentNodeDatabaseId
        saveContent
        dynamicContent
        attributes {
          className
          verticalAlignment
          width
        }
      }

      fragment WpCoreColumnsBlock on WpCoreColumnsBlock {
        name
        order
        originalContent
        parentNode {
          id
          ... on WpPost {
            title
          }
        }
        parentNodeDatabaseId
        dynamicContent
        attributes {
          ... on WpCoreColumnsBlockAttributes {
            align
            backgroundColor
            className
            customBackgroundColor
            customTextColor
            textColor
            verticalAlignment
          }
        }
        saveContent
      }

      fragment InnerBlocks on WpBlock {
        ... on WpCoreColumnBlock {
          ...WpCoreColumnBlock
        }
        ... on WpCoreColumnsBlock {
          ...WpCoreColumnsBlock
        }
      }

      query POST_QUERY {
        wpPost(title: { eq: "Gutenberg: Columns" }) {
          blocks {
            ... on WpCoreColumnsBlock {
              ...WpCoreColumnsBlock
            }
            innerBlocks {
              ...InnerBlocks
              innerBlocks {
                ...InnerBlocks
                innerBlocks {
                  ...InnerBlocks
                }
              }
            }
          }
        }
      }
    `
    const gatsbyResult = await fetchGraphql({
      url,
      query: gutenbergGatsbyQuery,
    })

    const gutenbergWpGraphQLQuery = gutenbergGatsbyQuery
      .replace(/Wp/gm, ``)
      .replace(
        `wpPost(title: { eq: "Gutenberg: Columns" }) {`,
        `post(id: "cG9zdDoxMjg=") {`
      )

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: gutenbergWpGraphQLQuery,
    })

    expect(WPGraphQLResult.data.post).toStrictEqual(gatsbyResult.data.wpPost)
  })

  it(`resolves wp-graphql-gutenberg layout elements`, async () => {
    const gutenbergGatsbyQuery = /* GraphQL */ `
      {
        wpPost(id: { eq: "cG9zdDoxMjU=" }) {
          title
          blocks {
            name
            ... on WpCoreButtonBlock {
              attributes {
                ... on WpCoreButtonBlockAttributes {
                  align
                  backgroundColor
                  borderRadius
                  className
                  customBackgroundColor
                  customGradient
                  customTextColor
                  gradient
                  linkTarget
                  placeholder
                  rel
                  text
                  textColor
                  title
                  url
                }
              }
            }
            ... on WpCoreFileBlock {
              attributes {
                downloadButtonText
                fileName
                href
                id
                showDownloadButton
                textLinkHref
                textLinkTarget
              }
            }
            ... on WpCoreSpacerBlock {
              attributes {
                height
              }
            }
            ... on WpCoreSeparatorBlock {
              attributes {
                color
                customColor
                className
              }
            }
          }
        }
      }
    `
    const gatsbyResult = await fetchGraphql({
      url,
      query: gutenbergGatsbyQuery,
    })

    const gutenbergWpGraphQLQuery = gutenbergGatsbyQuery
      .replace(/Wp/gm, ``)
      .replace(
        `wpPost(id: { eq: "cG9zdDoxMjU=" }) {`,
        `post(id: "cG9zdDoxMjU=") {`
      )

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: gutenbergWpGraphQLQuery,
    })

    expect(WPGraphQLResult.data.post).toStrictEqual(gatsbyResult.data.wpPost)
  })

  it(`resolves wp-graphql-gutenberg formatting blocks`, async () => {
    const gutenbergGatsbyQuery = /* GraphQL */ `
      {
        wpPost(id: { eq: "cG9zdDoxMjI=" }) {
          title
          blocks {
            name
            ... on WpCoreCodeBlock {
              originalContent
              attributes {
                content
              }
            }
            ... on WpCoreFreeformBlock {
              attributes {
                content
              }
            }
            ... on WpCoreHtmlBlock {
              attributes {
                content
              }
            }
            ... on WpCorePullquoteBlock {
              attributes {
                ... on WpCorePullquoteBlockAttributes {
                  citation
                  value
                }
              }
            }
            ... on WpCoreTableBlock {
              attributes {
                ... on WpCoreTableBlockAttributes {
                  body {
                    cells {
                      content
                      scope
                      tag
                    }
                  }
                  caption
                  foot {
                    cells {
                      content
                      scope
                      tag
                    }
                  }
                  hasFixedLayout
                  head {
                    cells {
                      content
                      scope
                      tag
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    const gatsbyResult = await fetchGraphql({
      url,
      query: gutenbergGatsbyQuery,
    })

    const gutenbergWpGraphQLQuery = gutenbergGatsbyQuery
      .replace(/Wp/gm, ``)
      .replace(
        `wpPost(id: { eq: "cG9zdDoxMjI=" }) {`,
        `post(id: "cG9zdDoxMjI=") {`
      )

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: gutenbergWpGraphQLQuery,
    })

    expect(WPGraphQLResult.data.post).toStrictEqual(gatsbyResult.data.wpPost)
  })

  it(`resolves wp-graphql-gutenberg common blocks`, async () => {
    const gutenbergGatsbyQuery = /* GraphQL */ `
      {
        wpPost(id: { eq: "cG9zdDo5NA==" }) {
          blocks {
            name
            ... on WpCoreParagraphBlock {
              attributes {
                ... on WpCoreParagraphBlockAttributes {
                  content
                }
              }
            }

            ... on WpCoreHeadingBlock {
              attributes {
                ... on WpCoreHeadingBlockAttributes {
                  content
                  level
                }
              }
            }

            ... on WpCoreImageBlock {
              attributes {
                ... on WpCoreImageBlockAttributes {
                  url
                }
              }
            }

            ... on WpCoreGalleryBlock {
              attributes {
                ... on WpCoreGalleryBlockAttributes {
                  images {
                    id
                    url
                  }
                }
              }
            }

            ... on WpCoreListBlock {
              attributes {
                ordered
                values
              }
            }

            ... on WpCoreAudioBlock {
              attributes {
                ... on WpCoreAudioBlockAttributes {
                  src
                }
              }
            }

            ... on WpCoreVideoBlock {
              attributes {
                src
              }
            }
          }
        }
      }
    `
    const gatsbyResult = await fetchGraphql({
      url,
      query: gutenbergGatsbyQuery,
    })

    const gutenbergWpGraphQLQuery = gutenbergGatsbyQuery
      .replace(/Wp/gm, ``)
      .replace(
        `wpPost(id: { eq: "cG9zdDo5NA==" }) {`,
        `post(id: "cG9zdDo5NA==") {`
      )

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: gutenbergWpGraphQLQuery,
    })

    expect(WPGraphQLResult.data.post).toStrictEqual(gatsbyResult.data.wpPost)
  })

  it(`resolves Yoast SEO data`, async () => {
    const yoastRootFields = /* GraphQL */ `
      seo {
        breadcrumbs {
          archivePrefix
          boldLast
          enabled
          homeText
          notFoundText
          prefix
          searchPrefix
          separator
          showBlogPage
        }
        openGraph {
          defaultImage {
            id
            title
          }
          frontPage {
            description
            image {
              id
              title
            }
            title
          }
        }
        redirects {
          format
          origin
          target
          type
        }
        schema {
          companyLogo {
            id
            title
          }
          companyName
          companyOrPerson
          inLanguage
          logo {
            id
            title
          }
          siteName
          siteUrl
          wordpressSiteName
          personLogo {
            id
            title
          }
        }
        social {
          facebook {
            url
            defaultImage {
              title
              id
            }
          }
          instagram {
            url
          }
          linkedIn {
            url
          }
          mySpace {
            url
          }
          pinterest {
            url
            metaTag
          }
          twitter {
            cardType
            username
          }
          wikipedia {
            url
          }
          youTube {
            url
          }
        }
        webmaster {
          baiduVerify
          googleVerify
          msVerify
          yandexVerify
        }
      }
    `

    const pageYoastFields = /* GraphQL */ `
      seo {
        breadcrumbs {
          text
        }
        canonical
        focuskw
        metaDesc
        metaKeywords
        metaRobotsNofollow
        metaRobotsNoindex
        opengraphAuthor
        opengraphDescription
        opengraphImage {
          id
          title
        }
        opengraphModifiedTime
        opengraphPublishedTime
        opengraphPublisher
        opengraphSiteName
        opengraphTitle
        opengraphType
        opengraphUrl
        title
        twitterDescription
        twitterImage {
          id
          title
        }
        twitterTitle
      }
    `

    const gatsbyResult = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          wp {
            ${yoastRootFields}
          }
          wpPage(title: {eq: "Yoast SEO"}) {
            ${pageYoastFields}
          }
        }
      `,
    })

    const WPGraphQLResult = await fetchGraphql({
      url: process.env.WPGRAPHQL_URL,
      query: /* GraphQL */ `
        {
          ${yoastRootFields}
          page(id: "cG9zdDo3ODY4") {
            ${pageYoastFields}
          }
        }
      `,
    })

    const wpGraphQLPageNormalizedPaths = JSON.parse(
      JSON.stringify(WPGraphQLResult.data.page).replace(
        /https:\/\/gatsbyinttests.wpengine.com/gm,
        ``
      )
    )

    expect(gatsbyResult.data.wpPage).toStrictEqual(wpGraphQLPageNormalizedPaths)
    expect(gatsbyResult.data.wp.seo).toStrictEqual(WPGraphQLResult.data.seo)
  })

  incrementalIt(`resolves menus`, async () => {
    const result = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          allWpMenu {
            nodes {
              name
              count
              id
              databaseId
              menuItems {
                nodes {
                  id
                  label
                  databaseId
                  nodeType
                  target
                  title
                  url
                  childItems {
                    nodes {
                      label
                      id
                      databaseId
                      connectedNode {
                        node {
                          ... on WpPost {
                            title
                            uri
                            featuredImage {
                              node {
                                title
                              }
                            }
                          }
                        }
                      }
                      childItems {
                        nodes {
                          label
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()
  })

  incrementalIt(`resolves pages`, async () => {
    const result = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          testPage: wpPage(id: { eq: "cG9zdDoy" }) {
            title
          }
          allWpPage(sort: { fields: date }) {
            nodes {
              uri
              title
              wpChildren {
                nodes {
                  ... on WpNodeWithTitle {
                    title
                  }
                }
              }
              author {
                node {
                  name
                }
              }
              translations {
                title
              }
              acfPageFields {
                fieldGroupName
              }
            }
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testPage.title).toEqual(
      process.env.WPGQL_INCREMENT ? `Sample Page DELTA SYNC` : `Sample Page`
    )
  })

  incrementalIt(`resolves posts`, async () => {
    const result = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          testPost: wpPost(id: { eq: "cG9zdDox" }) {
            title
          }
          allWpPost(sort: { fields: date }) {
            nodes {
              title
              featuredImage {
                node {
                  altText
                  sourceUrl
                }
              }
              author {
                node {
                  avatar {
                    url
                  }
                  comments {
                    nodes {
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testPost.title).toEqual(
      process.env.WPGQL_INCREMENT ? `Hello world! DELTA SYNC` : `Hello world!`
    )
  })

  incrementalIt(`resolves users`, async () => {
    const result = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          testUser: wpUser(id: { eq: "dXNlcjox" }) {
            firstName
          }
          allWpUser {
            nodes {
              name
              databaseId
              pages {
                nodes {
                  title
                }
              }
              posts {
                nodes {
                  title
                }
              }
            }
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()

    expect(result.data.testUser.firstName).toEqual(
      process.env.WPGQL_INCREMENT ? `Tyler DELTA SYNC` : `Tyler`
    )
  })

  incrementalIt(`resolves root fields`, async () => {
    const result = await fetchGraphql({
      url,
      query: /* GraphQL */ `
        {
          wp {
            allSettings {
              discussionSettingsDefaultCommentStatus
              discussionSettingsDefaultPingStatus
              generalSettingsDateFormat
              generalSettingsDescription
              generalSettingsLanguage
              generalSettingsStartOfWeek
              generalSettingsTimeFormat
              generalSettingsTimezone
              generalSettingsTitle
              generalSettingsUrl
              readingSettingsPostsPerPage
              writingSettingsDefaultCategory
              writingSettingsDefaultPostFormat
              writingSettingsUseSmilies
            }
            nodeType
            writingSettings {
              defaultCategory
              defaultPostFormat
              useSmilies
            }
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()
  })
})
