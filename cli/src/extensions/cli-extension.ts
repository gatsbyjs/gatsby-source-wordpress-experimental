import { GluegunToolbox } from "gluegun"

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox): void => {
  toolbox.foo = (): void => {
    toolbox.print.info(`called foo extension`)
  }

  // enable this if you want to read configuration in from
  // the current folder's package.json (in a "wpgatsby" property),
  // wpgatsby.config.json, etc.
  // toolbox.config = {
  //   ...toolbox.config,
  //   ...toolbox.config.loadConfig("wpgatsby", process.cwd())
  // }
}
