const prettier = require(`prettier`)
const Joi = require(`@hapi/joi`)
const Handlebars = require(`handlebars`)
const fs = require(`fs-extra`)
const _ = require(`lodash`)
const toc = require(`markdown-toc`)
const clipboardy = require(`clipboardy`)

const {
  pluginOptionsSchema,
} = require(`./plugin/dist/steps/declare-plugin-options-schema`)

// :( poor children
const excludeParentsChildren = [`RootQuery`]
/**
 * Takes the keys from a Joi schema and recursively
 * turns the nested keys into structured markdown documentation
 *
 * @param {object} keys
 * @param {string} mdString
 * @param {number} level
 * @param {string} parent
 */
function joiKeysToMD({
  keys,
  mdString = ``,
  level = 1,
  parent = null,
  parentMetas = [],
}) {
  if (parentMetas.length && parentMetas.find((meta) => meta.portableOptions)) {
    return mdString
  }

  Object.entries(keys).forEach(([key, value]) => {
    const isRequired = value.flags && value.flags.presence === `required`

    const title = `${parent ? `${parent}.` : ``}${key}${
      isRequired ? ` (**required**)` : ``
    }`

    mdString += `${`#`.repeat(level + 1)} ${title}`

    if (value.flags && value.flags.description) {
      mdString += `\n\n`
      const description = value.flags.description.trim()
      mdString += description.endsWith(`.`) ? description : `${description}.`
    }

    if (value.flags && value.flags.presence === `required`) {
      mdString += `\n\n`
      mdString += `**Required:** yes`
    }

    if (value.type) {
      mdString += `\n\n`
      mdString += `**Field type**: \`${_.startCase(value.type)}\``
    }

    if (value.flags && `default` in value.flags) {
      const defaultValue = value.flags.default

      let printedValue

      if (typeof defaultValue === `string`) {
        printedValue = defaultValue
      } else if (Array.isArray(defaultValue)) {
        printedValue = `[${defaultValue.join(`, `)}]`
      } else if (
        [`boolean`, `function`, `number`].includes(typeof defaultValue)
      ) {
        printedValue = defaultValue.toString()
      } else if (defaultValue === null) {
        printedValue = `null`
      }

      if (typeof printedValue === `string`) {
        mdString += `\n\n`
        mdString += `**Default value**: ${
          printedValue.includes(`\n`)
            ? `\n\`\`\`js\n${printedValue}\n\`\`\``
            : `\`${printedValue}\``
        }`
      }
    }

    if (value.examples && value.examples.length) {
      value.examples.forEach((example) => {
        mdString += `\n\n\`\`\`js\n` + example + `\n\`\`\`\n`
      })
    }

    mdString += `\n\n`

    const excludeChildren = excludeParentsChildren.includes(key)

    if (!excludeChildren && value.keys) {
      mdString = joiKeysToMD({
        keys: value.keys,
        mdString,
        level: level + 1,
        parent: title,
        parentMetas: value.metas,
      })
    }

    if (!excludeChildren && value.items && value.items.length) {
      value.items.forEach((item) => {
        if (item.keys) {
          mdString = joiKeysToMD({
            keys: item.keys,
            mdString,
            level: level + 1,
            parent: title + `[]`,
            parentMetas: value.metas,
          })
        }
      })
    }
  })

  return mdString
}

/**
 * Converts the Joi schema description into markdown
 * and writes it to the filesystem
 *
 * @param {object} description
 */
async function generateMdFileFromSchemaDescription(description) {
  const template = Handlebars.compile(`# Plugin Options

[comment]: # (This file is automatically generated. Do not edit it directly. Instead, edit the Joi schema in ./plugin/src/steps/declare-plugin-options-schema.js)
{{{tableOfContents}}}
{{{docs}}}

# Up Next :point_right:

- :boat: [Migrating from other WP source plugins](./migrating-from-other-wp-source-plugins.md)
- :computer: [Using Data](./using-data.md)
- :house: [Hosting WordPress](./hosting.md)
- :athletic_shoe: [Themes, Starters, and Examples](./themes-starters-examples.md)
- :medal_sports: [Usage with popular WPGraphQL extensions](./usage-with-popular-wp-graphql-extensions.md)
- :hammer_and_wrench: [Debugging and troubleshooting](./debugging-and-troubleshooting.md)
- :national_park: [Community and Support](./community-and-support.md)
- :point_left: [Back to README.md](../README.md)`)

  const docs = joiKeysToMD({
    keys: description.keys,
  })
  const tableOfContents = toc(docs).content

  const mdContents = template({
    tableOfContents,
    docs,
  })

  const mdContentsFormatted = prettier.format(mdContents, {
    parser: `markdown`,
  })

  await fs.writeFile(`./docs/plugin-options.md`, mdContentsFormatted)
}

const description = pluginOptionsSchema({ Joi }).describe()

clipboardy.writeSync(JSON.stringify(description))

generateMdFileFromSchemaDescription(description)