import fetchGraphql from "gatsby-source-wordpress-experimental/utils/fetch-graphql"
import execall from "execall"

const countGatsbyImgs = (string) =>
  execall(/gatsby-image-wrapper/gim, string).length

describe(`[gatsby-source-wordpress-experimental] Gatsby image processing`, () => {
  it(`transforms inline-html images properly`, async () => {
    const {
      data: {
        wpPage,
        // gute,
        editedInline,
        editedMediaLibrary,
        acfPage,
        httpProtocolPage,
      },
    } = await fetchGraphql({
      url: `http://localhost:8000/__graphql`,
      query: /* GraphQL */ `
        {
          # Inline gatsby-image Gutenberg test #8964
          wpPage(id: { eq: "cG9zdDo4OTY0" }) {
            content
          }
          # edited Inline gatsby-image test
          editedInline: wpPage(databaseId: { eq: 9208 }) {
            content
          }
          # edited via media library Inline gatsby-image test
          editedMediaLibrary: wpPage(databaseId: { eq: 9219 }) {
            content
          }
          # inline html ACF test
          acfPage: wpPage(databaseId: { eq: 7646 }) {
            acfPageFields {
              wysiwygEditorField
            }
          }
          # Page with img src hardcoded to http isntead of https
          httpProtocolPage: wpPage(databaseId: { eq: 10513 }) {
            content
          }
        }
      `,
    })

    expect(wpPage.content).toBeTruthy()
    expect(countGatsbyImgs(wpPage.content)).toBe(2)
    expect(wpPage.content).toMatchSnapshot()

    expect(editedInline.content).toBeTruthy()
    expect(countGatsbyImgs(editedInline.content)).toBe(1)
    expect(editedInline.content).toMatchSnapshot()

    expect(editedMediaLibrary.content).toBeTruthy()
    expect(countGatsbyImgs(editedMediaLibrary.content)).toBe(1)
    expect(editedMediaLibrary.content).toMatchSnapshot()

    expect(acfPage.acfPageFields.wysiwygEditorField).toBeTruthy()
    expect(countGatsbyImgs(acfPage.acfPageFields.wysiwygEditorField)).toBe(2)
    expect(acfPage.acfPageFields.wysiwygEditorField).toMatchSnapshot()

    expect(httpProtocolPage.content).toBeTruthy()
    expect(countGatsbyImgs(httpProtocolPage.content)).toBe(1)
    expect(httpProtocolPage.content).toMatchSnapshot()
  })
})
