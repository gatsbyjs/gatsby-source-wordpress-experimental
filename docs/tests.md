**This page has moved to the [Gatsby monorepo!](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-wordpress/docs/tests.md)**

Hi there! 👋 thank you so much for being a beta/alpha tester of this plugin!
You've helped us bring a much more stable WordPress integration to Gatsby and we're very thankful for that!

We've shipped this plugin as `gatsby-source-wordpress@4.0.0`.
`gatsby-source-wordpress-experimental` is now deprecated.
Please upgrade by npm/yarn installing the latest version of the stable plugin and updating your gatsby-config.js to include the stable plugin name.

We've chosen this point to release this plugin as a stable release not because there are no bugs (all software has some bugs), but because this plugin is far more stable than the last major version of `gatsby-source-wordpress`.

Note that we will continue fixing Github issues you've opened in the -experimental repo - those are not forgotten and will be transferred to the Gatsby monorepo.

Thank you! 💜

# Running Tests

- `yarn test` will run the entire suite
- `yarn test-schema` will run the schema integration suite and the increment.
- `yarn test-schema-watch` will watch the first schema suite.
- `yarn test-schema-first` will run the first schema suite. you can pass jest arguments here
- `yarn test-schema-increment` will run the second schema suite
- `yarn test-build` will run the build integration suite
- `yarn test-build-watch` will watch the build integration suite
- `yarn test-update` will run `-u` for all schema and build integration suites.

# Changing test suite WordPress plugin versions in docker

1. Edit the versions as desired in `docker-compose.yml` in the `build.args` for `wordpress` service
2. Run `yarn docker-start -d` to detach, force re-build images and re-create containers, and ensure the plugins directory (volume) is renewed between builds
3. Run `yarn test-schema`. You should see a diff in the snapshots that demonstrates the change in schema with the changed plugin versions.
4. Run `yarn test-update` to update all test snapshots.
