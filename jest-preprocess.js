const babelPreset = require(`./babel.config.js`)
module.exports = require(`babel-jest`).createTransformer({
  ...babelPreset,
  overrides: [
    ...(babelPreset.overrides || []),
    {
      test: [`**/*.ts`, `**/*.tsx`],
      plugins: [[`@babel/plugin-transform-typescript`, { isTSX: true }]],
    },
  ],
})
