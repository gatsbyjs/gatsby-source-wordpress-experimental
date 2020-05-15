import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"

describe(`[gatsby-source-wordpress-experimental] filtered type definitions`, () => {
  test(`Date field resolver is working`, async () => {
    const result = await fetchGraphql({
      url: `http://localhost:8000/___graphql`,
      query: /* GraphQL */ `
        {
          wpPage {
            year: date(formatString: "YYYY")
            month: date(formatString: "MMMM")
            dayOfMonth: date(formatString: "DD")
            dayOfWeekNumber: date(formatString: "E")
            dayOfWeekName: date(formatString: "dddd")
            date
          }
        }
      `,
    })

    expect(result).toMatchSnapshot()
  })
})
