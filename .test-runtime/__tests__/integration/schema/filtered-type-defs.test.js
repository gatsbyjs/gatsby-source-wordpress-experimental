import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"

describe(`[gatsby-source-wordpress-experimental] filtered type definitions`, () => {
  test(`Date field resolver is working`, async () => {
    const result = await fetchGraphql({
      url: `http://localhost:8000/___graphql`,
      query: /* GraphQL */ `
        {
          wpPage(id: { eq: "cG9zdDoy" }) {
            id
            databaseId
            year: date(formatString: "YYYY")
            month: date(formatString: "MMMM")
            dayOfMonth: date(formatString: "DD")
            dayOfWeekNumber: date(formatString: "E")
            dayOfWeekName: date(formatString: "dddd")
            date

            yearGmt: date(formatString: "YYYY")
            monthGmt: date(formatString: "MMMM")
            dayOfMonthGmt: date(formatString: "DD")
            dayOfWeekNumberGmt: date(formatString: "E")
            dayOfWeekNameGmt: date(formatString: "dddd")
            dateGmt: date

            yearModified: modified(formatString: "YYYY")
            monthModified: modified(formatString: "MMMM")
            dayOfMonthModified: modified(formatString: "DD")
            dayOfWeekNumberModified: modified(formatString: "E")
            dayOfWeekNameModified: modified(formatString: "dddd")
            dateModified: modified

            yearModifiedGmt: modifiedGmt(formatString: "YYYY")
            monthModifiedGmt: modifiedGmt(formatString: "MMMM")
            dayOfMonthModifiedGmt: modifiedGmt(formatString: "DD")
            dayOfWeekNumberModifiedGmt: modifiedGmt(formatString: "E")
            dayOfWeekNameModifiedGmt: modifiedGmt(formatString: "dddd")
            dateModifiedGmt: modifiedGmt
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()
  })
})
