module.exports = {
  presets: [[`babel-preset-gatsby-package`]],
  plugins: [
    [
      `babel-plugin-root-import`,
      {
        rootPathSuffix: `./src/`,
        rootPathPrefix: `~/`,
      },
    ],
    [
      `@babel/plugin-proposal-private-methods`,
      {
        loose: true,
      },
    ],
    [
      `@babel/plugin-proposal-class-properties`,
      {
        loose: true,
      },
    ],
    [
      `import-globals`,
      {
        dd: {
          moduleName: `dumper.js`,
          exportName: `dd`,
        },
        dump: {
          moduleName: `dumper.js`,
          exportName: `dump`,
        },
        clipboardy: {
          moduleName: `clipboardy`,
          exportName: `default`,
        },
      },
    ],
  ],
}
