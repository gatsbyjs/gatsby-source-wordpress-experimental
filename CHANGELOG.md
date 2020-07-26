# Change Log

## 1.1.1

### Bug Fixes

- Null values in html image caching were sometimes throwing errors. There are now guards against null values here.
- Top level inline fragments (for WP node interfaces that are not Gatsby @nodeInterface types) were not being generated along with regular fields. This caused WooCommerce price fields (and many other fields) to not be fetched even though the schema was properly generated for these types.

## 1.1.0

### Bug Fixes

- Bumped minimum WPGatsby version because the latest fixes a bug where saving a published post as a draft wouldn't delete the corresponding node.
- Updates during development were no longer automatically showing up in Gatsby due to inconsistencies in the latest version of Gatsby core

### Features

- Added a link to the wp-admin plugins page to update WPGatsby if your version is not within the accepted range.
- Split the WPGatsby and WPGraphQL upgrade reason error messages depending on wether one or both need to be updated.

## 1.0.14

### Features

- Improved the error message for GraphQL request timeouts via #86, thanks @jacobarriola!

## 1.0.13

### Bug Fixes

- Some fields on the `User` and `Page` types which are by default private were being automatically excluded via default plugin options. These fields have very low overhead and in some cases devs will filter these fields to make them public. This manifests to some devs as a bug because fields they're looking for don't exist. As of this release they're no longer excluded by default.

## 1.0.12

### Bug Fixes

- The root field data node was not being properly processed for html images, links, and referenced media node ids. This resulted in some media items going missing on root fields like options pages.

## 1.0.11

### Bug Fixes

- Absolute path images with no image node were causing errors because the hostname was not prepended in the case that no node exists.
- Images in code blocks and pre tags were being transformed when they shouldn't be.
- Images nodes fetched by url were sometimes being double fetched
- Images with no media item node or file node were being incorrectly cached.

## 1.0.10

### Bug Fixes

- Cast filenames to strings to prevent 0.jpeg from being taken as "no file name at all".jpeg 🤦‍♂️

## 1.0.9

### Bug Fixes

- The last release introduced and error `absolutePathUrls is not defined`

## 1.0.8

### Bug fixes

- Images with absolute paths were not being properly recognized. For example if you had an image with a src of `/content/2020/01/06/my.jpeg`, this would resolve in vanilla WP, but the source plugin wasn't recognizing it. The solution is to find absolute paths and fetch them with the hostname of the WP url attached to the beginning.
- Disallowed use of MediaItem.limit option as this option only introduces bugs and odd behaviour due to the special handling of this node type internally.
- Default exclude User.UserToMediaItemConnection field as this will cause many sites to fetch 100's more media items than needed. If you need this field you can enable this yourself by adding `type: { UserToMediaItemConnection: { exclude: false } }` to your plugin options.
- More file types than were required were being regexed for when searching for images in html fields. Now the types that are regexed for are `jpeg|jpg|png|gif|ico|mpg|ogv|svg|bmp|tif|tiff`.
- When accessing previously cached image nodes, protect against missing id's

## 1.0.7

### Bug Fixes

- Connection fields to interface types that consist entirely of Gatsby node types were not being handled properly in the query generation and schema customization steps. This is due to latest WPGraphQL using interface types for node connections in places where it previously wasn't, so this bug wasn't previously discovered.

## 1.0.6

Bumped minimum WPGQL version to `0.10.3` to prevent folks from running into a WPGQL resolver regression that caused some builds to fail.

## 1.0.5

### Bug Fixes

- Images fetched from HTML which had no corresponding WPGQL MediaItem and were just fetched as regular Gatsby File nodes weren't always being properly cached.
- Images fetched from HTML didn't have htaccess creds passed onto them, resulting in 401 errors.

## 1.0.4

### Bug Fixes

- If all of a types child fields were excluded, that type wouldn't also be excluded

## 1.0.3

### Bug Fixes

- New post draft previews and draft previews weren't working anymore. Minimum WPGatsby version has been increased in order to fix this.
- When an error path didn't exist in a GraphQL error, a property on undefined was being accessed which threw an unrelated error.

## 1.0.2

### Bug Fixes

- Lists of connect Gatsby nodes resolvers weren't properly returning empty arrays and instead would return `null` even if the remote schema returned an empty Array.
- Literal `null`s in arrays of connected nodes were failing the build

## 1.0.1

### New Features

- Added the error path from GraphQL errors to error output.
  For example: "Error path: mediaItems.nodes[77].mediaDetails.meta.focalLength"

## 1.0.0

This release adds no changes! This is the point at which we've decided to move this project into beta. `1.0.0` signifies this.

## 0.8.7

### New Features

Added a new api `addNodeFilter` and `applyNodeFilter` which work similarly to filters in vanilla WP. It allows any plugin to add a function to filter some data and then any other plugin to apply all registered filters. This is currently undocumented because it's not a finished or tested API.

## 0.8.6

### Bug Fixes

- Gatsby images in html do not currently lazy load properly. This will be fixed in a later release but for now this means we need to hide the placeholder on load using an inline css style.

## 0.8.5

### Bug Fixes

- Images that weren't transformable by Sharp were still being transformed which was causing problems
- When using the hardCacheMediaFiles option, file names were sometimes undefined or the extension wasn't properly handled
- Html image widths weren't being properly inferred in all cases due to a problem where a variable wasn't properly cast as a Number

## 0.8.4

Changed `verbose` plugin option to be true by default. This is a smarter default as it's more useful to see what the plugin is doing when you're first using it. If you don't want to see all the output it's easy to turn it off.

## 0.8.3

### Bug Fixes

- htaccess password and username were not being passed into the `createRemoteFileNode` helper which meant builds would fail if these files were protected.

## 0.8.2

### Bug Fixes

- GATSBY_CONCURRENT_DOWNLOAD couldn't be set lower than 3 without erroring.

## 0.8.1

### Bug Fixes

- Referenced MediaItem nodes were being incorrectly ignored when `html.useGatsbyImage` was set to `false`. This led to tons of images being fetched in resolvers instead of after node sourcing is complete which is problematic for some servers and causes the build to fail.
- Added error context messages to every instance of `fetchGraphQL()` to help give context on when a gql error occurred during the build.

## 0.8.0

Updated plugin to work with WPGraphQL 0.10.0 which provides better menu and preview support. This is listed as a minor because supported min version has been bumped and WPGraphQL has a lot of breaking changes for this release. Head to https://github.com/wp-graphql/wp-graphql/releases/tag/v0.10.0 for more information on updating.

## 0.7.14

### Bug Fixes

The `dateGmt` field which was previously mistakenly removed has been added back.

## 0.7.13

### Bug Fixes

- The non-node root query was ignoring GraphQL errors
- Referenced MediaItem node queries were missing any generated fragments

## 0.7.12

### Bug Fixes

- `pluginOptions.html.useGatsbyImage: false` wasn't preventing files from being downloaded in all cases.

### New Features

- Added an option, `pluginOptions.type.MediaItem.localFile.excludeByMimeTypes` to disable fetching files associated with MediaItem nodes by mime type.

## 0.7.11

### Bug Fixes

- Changed relative docs links to full URL's in the main README to work better with Gatsbyjs.org and npmjs.com

## 0.7.10

### Bug Fixes

- Removed Gatsby, gatsby-source-filesystem, and gatsby-transformer-sharp from dependencies list. These were causing yarn to error complaining about yarn link when installing this package. This may also have been causing OOM issues when installing.

## 0.7.9

### New Features

- Added a clearer error message about firewalls and firewall plugins when 403 errors are returned when making GraphQL requests.

### Bug Fixes

- The TermNode type was not being properly recognized as a Node Interface type. Because of this, terms were being double fetched and then nodes were being created twice. The second time the node was created it would be missing data because it was fetched on the term interface the second time. This release marks TermNode as a Node Interface similar to ContentNode, and that fixes this issue.

## 0.7.8

### Bug Fixes

- In some instances, using the `MediaItem.lazyNodes` option in combination with `html.useGatsbyImage` would cause build errors.

## 0.7.7

### Bug Fixes

- pathPrefix wasn't set up properly in 0.7.6. This releases fixes that. Thanks @trevorblades!

## 0.7.6

### Bug Fixes

- pathPrefix option wasn't being used for inline images in html

## 0.7.5

### Bug Fixes

- Url's needed to be encoded in createRemoteFileNode() to account for filenames with special characters

## 0.7.4

### Bug Fixes

- Automatically excluded EnqueuedAsset, ContentNodeToEnqueuedScriptConnection, ContentNodeToEnqueuedStylesheetConnection, TermNodeToEnqueuedScriptConnection, TermNodeToEnqueuedStylesheetConnection, UserToEnqueuedScriptConnection, UserToEnqueuedStylesheetConnection types because these types can't be properly utilized yet without causing errors.

## 0.7.3

### Bug Fixes

- Sometimes at the bottom of our query depth limit, fields which require a selection set were being queried without.
- Fixed an error for non-image media items where the build would fail since 0.7.1. The problem was that we were trying to access the media item by `sourceUrl` but non-image media items only have a `mediaItemUrl`

## 0.7.2

### Bug Fixes

- fixed an issue where incremental data fetching could error when some fields don't exist

## 0.7.1

### New Features

- In the event that the remote schema has broken pagination which causes infinite looping between pages of remote data, there are now some safeguards to protect against this. In a way this is a bug fix, but I'm listing it as a feature because the bug is on the remote server instead of within the source plugin.

## 0.7.0

### New Features

- Inline links in any node content (custom fields or in post_content) will be replaced with local relative links. https://your-beautiful-wp-site.com/page-2 will become /page-2 so that Gatsby can make sense of it.
- gatsby-plugin-catch-links is automatically installed as part of this plugin so that inline-html links work as gatsby-links out of the box.
- Inline html images anywhere in your node data are now gatsby-images. These are processed as fluid Sharp images, the media item node from WPGraphQL is fetched and added to your cache, the maxWidth of the fluid resize is inferred from html (if the img tag either has a sizes or width attribute, those are used) otherwise it falls back to a default plugin option:

```js
  html: {
    // this causes the source plugin to find/replace images in html
    useGatsbyImage: true,
    // this adds a limit to the max width an image can be
    // if the image selected in WP is smaller, or the image is smaller than this
    // those values will be used instead.
    imageMaxWidth: null,
    // if a max width can't be inferred from html, this value will be passed to Sharp
    // if the image is smaller than this, the images width will be used instead
    fallbackImageMaxWidth: 100,
    imageQuality: 90,
  },
```

If you delete an image in the media library which was uploaded to posts, you'll get a handy console warning telling you which post has the deleted image along with an edit url you can click to fix the problem.

## 0.6.1

### Bug Fixes

- Before plugin options were being merged into default plugin options (so no fallbacks for nested options), we were trying to access nested properties on undefined which was causing errors. This release fixes that and adds an integration test for this.

## 0.6.0

### Breaking Changes

- WPGraphQL and WPGatsby minimum versions have been bumped to 0.9.1 and 0.4.0 due to an oversight in how Menu Relay id's were constructed. Using WPGQL 0.9.0 and WPGatsby 0.4.0 would lead to inconsistent caching behaviour for menus.

### New Features

- Added a minimum version "reason" field to supported plugin versions to add an explanation for the minimum versions.

## 0.5.0

### Breaking Changes

- WPGraphQL and WPGatsby minimum versions have been bumped to 0.9.0 and 0.3.0 due to the structure of Relay id's changing in WPGraphQL. This is breaking for us because id's changing will result in inconsistent cache behavior.

## 0.4.5

### New Features

- `pluginOptions.schema.perPage` was added to control how many nodes are fetched per-page during node sourcing. This is helpful for sites with gigantic schemas that generate very large queries. In the future queries will automatically be split into multiple queries to mitigate this automatically but for now this option will do 👍
- Error context is now displayed when fetch errors occur, not just for GraphQL errors. Error context is something like "Error occurred while fetching the "Product" node type.

### Bug Fixes

- The `awaiting async side effects` reporter status is now only shown once some async side effects have occurred.

## 0.4.4

### Bug Fixes

- We were trying to fetch connections to WPGQL node interface types that don't have an id field by id. The schema should provide an id here, otherwise there's no way to id the connected node, but now that's protected against by checking if the field has an id before trying to fetch the id.

## 0.4.3

### Bug Fixes

- The message `pluginOptions.schema.queryDepth is not a positive integer. Using default value in place of provided value.` was being displayed when no plugin option for queryDepth was added. This release prevents that as we only want to display a warning if a value is provided.

## 0.4.2

### New Features

- Added additional error context for GraphQL request errors to print out which node type was being sourced when the error occurred.

### Bug Fixes

- Node interface types on the WPGQL side weren't being properly recognized, this release fixes that by using the \_\_typename field to identify which type node interface types should be stored as during node sourcing
- Reusable fragments were sometimes being nested inside themselves which would throw an error. This is now fixed.

## 0.4.1

### New Features

- Added plugin option `debug.timeBuildSteps` to add an activity timer to all the internal build steps the plugin goes through.

## 0.4.0

### Breaking Changes

- The minimum WPGatsby version has been increased to 0.2.5. This is because earlier versions were recording up to 4 duplicate content saves per content change in WordPress. This is the minimum version now because earlier versions may bloat your DB. WPGatsby does garbage collection, so any duplicate actions will be automatically removed.

## 0.3.2

### New Features

- When in verbose mode, content diffs are displayed in the terminal output when content changes. When the field contained a lot of data this was really noisy. Now field values that return more than 250 characters aren't shown - instead, the field key is simply printed as `[gatsby-source-wordpress] fieldKey updated`

## 0.3.1

### New Features

- The generated RootQuery GraphQL query is now written to disk when using the `debug.graphql.writeQueriesToDisk` option.
- Better error handling by printing out which step of the build caused an uncaught error below the stacktrace.
- Added an internal plugin options filter/validator and enforced that the `schema.queryDepth` option is a positive integer.

### Bug Fixes

- Previously `schema.queryDepth` didn't work when set to 1. Now you can do that if you're so clean that you only need the top level of WPGQL fields!

## 0.3.0

### New Features

- Any field named `date` is now treated as being of `Date` type and can make use of the `dateFormat` input args. In the future WPGraphQL will have a Date Scalar and that will be used to determine what should be a date instead of the field name.

### Breaking Changes

- Fields named `dateGmt` are automatically ignored

## 0.2.1

### Bug fixes

- Fixed an issue where ommitting the new `debug.graphql.writeQueriesToDisk` would cause build errors

## 0.2.0

### New Features

- Added plugin option `debug.graphql.writeQueriesToDisk` which writes out all the internal GraphQL queries to `./WordPress/GraphQL/[typname]` for each node type.
- Automatically generate fragments when types are infinitely nested within themselves. This makes fetching circular references more efficient and prevents running out of memory. wp-graphql-gutenberg and wp-graphql-woocommerce now appear to work!
- Increased default query depth and circular query limit since queries are more efficient now.
- Added the ability to exclude fields on the RootQuery via plugin options.
- Removed some fields that require auth by default:

```js
RootQuery: {
  excludeFieldNames: [`viewer`, `node`, `schemaMd5`],
},
Settings: {
  excludeFieldNames: [`generalSettingsEmail`],
},
GeneralSettings: {
  excludeFieldNames: [`email`],
},
```

### Bug Fixes

- When generating queries fields which are circular between 2 types are now disallowed and not fetched. This indicates that these are connections which can't be identified as nodes so there is no efficient way to fetch them. They are excluded and the schema author should make these connections identifiable as nodes by adding an id field to them.
- Switch from graphql-prettier to prettier since it turns out the former is not very accurate. This was a minor bug but could affect debugging accuracy when queries were prettified.
- Non node root fields which take any input arg with a type of ID are automatically ignored now. They are almost definitely unusable without input args.

## 0.1.13

### New Features

- Renamed excludeFields to excludeFieldNames to keep the API consistent with the Type.excludeFieldNames option.

## 0.1.12

### New Features

- Added a new plugin option for HTTP Basic authentication:

```js
{
  resolve: `gatsby-source-wordpress-experimental`,
  options: {
    auth: {
      htaccess: {
        username: `username`,
        password: `password`,
      }
    }
  }
}
```

## 0.1.11

### Bug Fixes

- Fixed regression in the generated resolver for lists of unions in `src/steps/create-schema-customization/transform-fields/transform-union.js`. The `field` variable was being declared twice and accessed before it was initialized the second time.
- Fixed a query generation / node sourcing bug where fields that should have a selection set were being queried as if they didn't which would fail the build during node sourcing. The issue was due to the new `schema.circularQueryLimit` option which limits circular query generation separately from the overall `schema.queryDepth` option. Circular field references at the bottom level were sometimes missing their selectionsets.

## 0.1.10

### New Features

- Added plugin option `debug.disableCompatibilityCheck`. This is useful for testing the source plugin against versions of WPGraphQL outside the current accepted version range.

## 0.1.9

### Bug Fixes

- Type.exclude was not removing types from inline fragments during node sourcing, that is now fixed.
- Auto aliasing of conflicting field types in inline fragments is now recursive into nested fields.
- Added proper field def to resolve non_null lists of non_null types. `[Type!]!`

### New Features

- Added a new plugin option `schema.circularQueryLimit` which is used to set a limit on how many times a field type can be an ancestor of itself during query generation for node sourcing. This should help prevent out of memory issues for gigantic schemas with fields that are potentially infinitely nested. The default limit is set to 2 but this can be increased.
- exclude editLock and revisionOf fields by default as these fields require authentication.
- remove reliance on WPGatsby's postTypes field and use inputFields from introspection to determine which node list queries require the temporary `where: { parent: null }` input args to get a flat list of posts/pages. This slightly speeds up the sourcing process.
- Added a plugin option for debugging node list query generation. `debug.graphql.copyNodeSourcingQueryAndExit` expects to be passed the type name of a WPGraphQL node such as `Page`. If the Gatsby site is in development mode and a valid type is passed to this option it will write the node list query to be used in node sourcing to the system clipboard and exit the build process.

## 0.1.8

### New Features

`MediaItem.remoteFile` was deprecated and renamed to `MediaItem.localFile`. This more closely aligns with other Gatsby source plugins schemas.

## 0.1.7

The `User.description` field was mistakenly excluded by default, this release adds it back to the schema

## 0.1.6

Removed unecessary logic when fetching menu items that could prevent pulling some types of child items

## 0.1.5

### New Features

1. There is now a `type.__all` option which allows you to pass options to all types instead of only to specific types.

2. Because of the way menu items work in WPGraphQL, any child items in a menu need to be fetched recursively. Since this part of the build process didn't have any cli reporting the build appeared to hang for sites with a lot of menu items.
   This release adds logging to that part of the build step, explicitly telling you if there are async side-effects happening with a readout of how many additional nodes were created.

```
success  gatsby-source-wordpress  creating nodes - 57.784s - awaiting async side effects - 710 additional nodes fetched
```

In addition, this release moves recursive menu item sourcing into an async queue so we can increase concurrency and speed this up a bit.
In the future this will be less of an issue when WPGraphQL moves most node queries to a flat architecture.

## 0.1.4

### Bug Fixes

When fetching data for interface types, shared fields were being fetch on each inline fragment like so:

```graphql
{
  contentNode {
    title
    ... on Post {
      title
      otherPostField
    }
    ... on Page {
      title
      otherPageField
    }
  }
}
```

Normally that wasn't such a big deal since it just made the queries during node sourcing larger but didn't break anything. For interfaces with particularly deeply nested fields this was a huge problem (namely for Gutenberg).
This release solves this by only fetching these shared fields directly on the interface field.

```graphql
{
  contentNode {
    title
    ... on Post {
      otherPostField
    }
    ... on Page {
      otherPageField
    }
  }
}
```

## 0.1.3

### Bug fixes

- Previously root fields that were lists of non_null built in Scalars or non_null lists of Scalars on RootQuery fields that weren't lists of nodes could throw errors in some cases. This release fixes that.

## 0.1.2

### New Features

- Using the types.TypeName.lazyNodes option now works properly. Essentially what this option does is prevent fetching remote files and processing them via gatsby-image/Sharp unless they're queried for. When queried for, remote files are fetched in the gql resolver if the file doesn't exist locally. It's not recommended to use this if you're using gatsby-image a lot as fetching images this way is much slower. You might want to use this if you mostly use the original WP hosted media files 95% of the time and then just use a few gatsby-image's locally.

## 0.1.1

### Breaking changes

- Changed accepted WPGatsby version range to ~0.2.3

### Bug Fixes

- Because everything is fetched in a flat list, hierarchical terms weren't being properly sourced. Code was added to specifically support the Category type, but this will be made generic for all types soon as this is a reocurring problem.

## 0.1.0

### Breaking changes

- Changed accepted WPGatsby version range to ~0.2.2
- Changed accepted WPGraphQL version range to ~0.8.3
- Removed custom WpContentTypes type and contentTypes field as WPGraphQL 0.8.3 has this built in now

## 0.0.42

### Bug Fixes

- Scoped babel plugin source-map-support to just development env to prevent `warn Module not found: Error: Can't resolve 'fs' in warn Module not found: Error: Can't resolve 'module' in` errors

## 0.0.41

### Bug Fixes

- The `copyQueryOnError` plugin option was throwing cryptic errors on systems that don't support copy (namely CI). Now this is in a try/catch and the error is tossed away. This helps ensure users see relevant errors.

## 0.0.40 - skipped

## 0.0.39

### Bug Fixes

- Fixed normalizeUri helper to account for null uri (if a node has no uri)

### Features

- Improved fetch error messages. Some users were getting confused when they added www. to their api url setting. Visiting that URL in browser brought them to the GraphQL api endpoint. The problem is that WP seems to sometimes redirect in browser and axios can't handle this. The new error messages account for this.

## 0.0.38

### Bug Fixes

- For fields that are connections to lists of nodes, default variables were added to grab the first 100, before the max was 10. In the future an API will need to be added to resolve these lists of connections on the Gatsby-side, for now this works for a good deal of use-cases

## 0.0.37

### Bug Fixes

- Adding Preview support in an earlier release broke inc-builds in an effort to speed up previews. This release restores inc-builds functionality

## 0.0.36

### Bug Fixes

- Fixed lists of non_null types which have their type on type.ofType.ofType instead of type.ofType

## 0.0.35

### Bug Fixes

- Lists of MediaItems were not being recognized as media files that are referenced. This means those media items weren't being sourced as we only source referenced media items. This version fixes that issue!

## 0.0.34

### Bug Fixes

- Fixed an error where queries return null for some posts and we were checking properties on null. https://github.com/TylerBarnes/using-gatsby-source-wordpress-experimental/issues/6

## 0.0.33

### Features

- Updated Readme for npm

## 0.0.32

### Bug Fixes

- In the schema, lists of non null types weren't being properly ingested. For example a NON_NULL list of Blocks. This is now fixed! Thanks Peter Pristas!
