// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build } = require(`gluegun`)

/**
 * Create the cli and kick it off
 */
async function run(argv): Promise<void> {
  // create a CLI runtime
  const cli = build()
    .brand(`wpgatsby`)
    .src(__dirname)
    .plugins(`./node_modules`, { matching: `wpgatsby-*`, hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .defaultCommand()
    .create()
  // enable the following method if you'd like to skip loading one of these core extensions
  // this can improve performance if they're not necessary for your project:
  // .exclude(['meta', 'strings', 'print', 'filesystem', 'semver', 'system', 'prompt', 'http', 'template', 'patching', 'package-manager'])
  // and run it
  const toolbox = await cli.run(argv)

  // send it back (for testing, mostly)
  return toolbox
}

module.exports = { run }
