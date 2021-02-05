const deprecationNotice = require(`./plugin/deprecation-notice.json`)
const fs = require(`fs-extra`)
const path = require(`path`)
const globby = require(`globby`)

;(async () => {
  const docsPaths = await globby(path.join(__dirname, `docs`, `**`, `*.md`))

  for (const mdPath of docsPaths) {
    const fileContents = await fs.readFile(mdPath, `utf8`)
    const relativePath = mdPath.replace(__dirname, ``)
    const hasMovedToMessage = `This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress${relativePath})`

    const newFileContents = `**${hasMovedToMessage}**\n\n${deprecationNotice}\n\n${fileContents}`

    await fs.writeFile(mdPath, newFileContents, { encoding: `utf8` })
    console.log(`Deprecated ${relativePath}`)
  }
})()
