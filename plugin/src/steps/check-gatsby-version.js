const semver = require(`semver`)
const fs = require(`fs`)

export function checkGatsbyVersion({ reporter }) {
  const packageJson = JSON.parse(
    fs.readFileSync(`${process.cwd()}/package.json`, { encoding: `utf8` })
  )

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  const gatsbyVersion = deps.gatsby

  if (!semver.satisfies(gatsbyVersion, `>=2.24.74`)) {
    reporter.panic({
      context: {
        sourceMessage: `The minimim supported Gatsby version is 2.24.74`,
      },
    })
  }
}
