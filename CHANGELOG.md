# Change Log

## 3.1.3

- Gatsby core recently removed cache-manager-fs-hash which this plugin was importing. Unfortunately this plugin didn't have it declared as a dependency. This is now fixed!

## 3.1.2

- Inline html links which had query params were not being made into relative Gatsby paths. This release fixes that. Thanks @rburgst!

## 3.1.1

- The type limit option could potentiall throw GraphQL errors about non-null fields that are queried on connections to nodes that don't exist (due to the limit option). This release changes things so it returns null for the entire node or omits it from a list when it's missing.

## 3.1.0

- Adds WPGraphQL type and field descriptions to the Gatsby schema.

## 3.0.4

- Gatsby image's in inline html were being created with divs. This is problematic because div's, being block elements, cannot be descendants of paragraphs, which WP often puts inline html images into. They are now spans that are set to `display: inline-block` via a style.css file.
- The inline-html image widths were not always being properly carried through to the gatsby image style prop and were in many cases too small. This is now fixed.
- The default fallback max image width in inline html has been increased from 100 to 1024. Usually we can infer the width but when we cannot, 100px is far too small. For images that are smaller than 1024px, we will use their max width returned from GraphQL instead.

## 3.0.3

- `reporter.error()` now expects a string to be passed to it and wont accept an error object. Passing an error object will throw Joi errors and obscure the real error. I've updated `fetchGraphQL` to pass the error message instead of the error object to `reporter.error`

## 3.0.2

- Incremental builds were not properly fetching delta updates because the inc builds runner keeps around plugin state, and this plugin was assuming it didn't.
- ENABLE_GATSBY_REFRESH_ENDPOINT was being used to determine wether or not we were in preview mode. Inc builds also uses this env variable which was causing problems. We now track wether we're in preview mode using internal state instead.
- `updateSchema` was being called outside development which was causing problems where it would freeze Gatsby's state machine. This was only meant to be called in development and so has been scoped to NODE_ENV=development.

## 3.0.1

- Logs `got` HTTPErrors before rejecting because in some cases this error appeared to be completely swallowed somewhere before our `errorPanicker` function could access it.

## 3.0.0

This major release rolls out a new Preview experience which is faster, more reliable, and includes remote error handling!

## New features

- Previews of brand new drafts now work properly. Previously they would be iffy and could show a 404 until Gatsby finished sourcing data.
- A loading screen is displayed in WordPress until the Preview is ready in Gatsby, this solves the case mentioned above where WP couldn't be aware which state Gatsby is in and would display 404's or stale preview data.
- Removing unused fields from your WPGraphQL schema will no longer cause preview errors. Previously this would require a re-start of the preview server.
- In both Preview and regular `gatsby develop`, updating the schema (for ex adding new acf fields) will be picked up and the schema and node sourcing queries will be re-built on the fly. This means you don't need to re-start `gatsby develop` while developing sites! It also makes Preview much more resilient 👍 Previously this would also clear the entire cache when you restarted gatsby develop, making development less enjoyable and making it take longer to develop sites.
  So for example you can now add a new acf field while `gatsby develop` is running and the updated schema will immediately be available to query in your Gatsby site (so in page templates or in graphiql). As soon as a post is updated with new data, that new data will resolve in Gatsby.
- Adding new post types previously required a re-start of `gatsby develop` (so also a re-start of Preview), new post types are now automatically picked up during Preview and development. If developers build their pages using the `WpContentNode` interface (which is a type that encompasses all post types), Preview will work for all new post types without developer intervention! This means that in the future, themes can be constructed in a way in which they could be implemented entirely without a developers help.
- Webhook calls are limited (per-post) to one call every 5 seconds. This fixes the issue where Gutenberg will call save_post multiple times when pressing "preview". Previously this resulted in duplicate Preview builds.
- Previously, if you had revisions disabled, Preview would not work in some cases. Preview now works wether or not revisions are disabled.
- The WPGatsby Preview template client now supports all widely used browsers including IE11 with backwards compatible CSS and JS with polyfills and transpilation.
- Remote error handling with steps on how to fix the problem has been added! Handled errors include:
  - No page created for previewed node (need to create a page for nodes of this type in gatsby-node.js)
  - Preview instance received data from the wrong URL (Gatsby is configured to source data from a different WordPress instance. Compare your WPGatsby and gatsby-source-wordpress-experimental settings)
  - General Gatsby Preview process errors are caught and a generic error about which step the error occured in is sent back to WP. WP displays the generic error and encourages the user to check their preview logs for a more detailed error
  - When posting to the preview instance, wether or not the webhook is online is recorded, if it's offline the preview template will display an error about this. If it's online, the preview template will optimistically try to load the preview. In both cases (it's online & offline), the preview template will simultaneously check again in browser if Cloud is online or not, and react accordingly (display an error or load the preview if it hasn't already). This is good because not every load of the preview template will trigger a webhook (if no data has changed), so we need a solid way to handle errors if the preview server goes down in this case and an admin re-loads the preview window on the WP side.
- WPGatsby misconfiguration handling. Both of the following will display an error with steps on how to fix.
  - No preview frontend url is set but Gatsby Preview is enabled in WPGatsby settings.
  - The post type being previewed is not set to show in GraphQL (so is not previewable. includes a link to the WPGraphQL docs to remedy this as well as steps on how to make any future post types previewable without developer intervention).

## Caveats

- Gutenberg and ACF do not work together for WP Previews. Gutenberg breaks ACF preview (this is not a Gatsby or WPGatsby problem), so if you want to preview ACF, you cannot use Gutenberg.
- You must add a node id to pageContext when creating pages if you want to be able to preview that page. If you don't do this, you'll see a misconfiguration error in the preview window.

## 2.4.0

Added support for WPGraphQL 1.0.0! https://github.com/wp-graphql/wp-graphql/releases/tag/v1.0

## 2.3.1

- Deleting a post in WordPress which had been excluded in plugin options in Gatsby would fail the build previously. There are now checks in place that prevent and info about what's happening is logged to the terminal output.

## 2.3.0

- Added a check where if html is returned from the GraphQL endpoint, we append `/graphql` to the url and try again. If that returns JSON, we panic and display an error telling the developer to update the url to include `/graphql`. Thanks @acao!!

## 2.2.1

- Fixed a bug where the new `pluginOptionsSchema` would display a warning instead of working properly. `pluginOptionsSchema` works differently than other Gatsby node API's in that this API cannot have a nested function returned to it which will be called. All other Node API's allow this but pluginOptionsSchema does not. This is now fixed though!

## 2.2.0

- Implemented the new Gatsby core node API `pluginOptionsSchema` to validate user options. Thanks @mxstbr and @sslotsky!

## 2.1.4

- Fixed issue #151 where the `html.imageMaxWidth` option was not being properly respected. Thanks @acao!

## 2.1.3

- Added a `MediaItem.localFile.maxFileSizeBytes` option with a default of `15728640` which is 15Mb. This is not considered a breaking change because Gatsby currently has a hard time processing large files. It's very unlikely that anyone with files larger than this were able to run a build previously which means this will fix a bug for most users who have very large files in their WP instance.

## 2.1.2

- Inverted the background and foreground colours for the formatLogMessage helper to help increase contrast across more terminal themes.

## 2.1.1

- Increased the supported version range of WPGraphQL to support the recently released v0.15.0.
- Simplified the compatibility API error message for plugins out of range to clarify next steps for the user.

## 2.1.0

- Multiple instances of the source plugin in 1 Gatsby site have been disallowed and an error will be thrown if there are more than 1 added. Previously this was allowed by the plugin, but each instance would overwrite each others state. This is not considered a breaking change because adding multiple instances would result in buggy sites with missing data. Follow https://github.com/gatsbyjs/gatsby-source-wordpress-experimental/issues/58 for more info on why this is the case and when this feature will be available.

## 2.0.4

- `pluginOptions.schema.perPage` was not being passed through when fetching referenced media items in html.

## 2.0.3

- While moving our repo into a monorepo to support CI tests, an index.js was misplaced, causing workspace installations of this plugin to fail.

## 2.0.2

- Fixes a case where an error object was being treated as a string. Thanks @rburgst!

## 2.0.1

- Added missing README.md from the last publish!

## 2.0.0

- First publish with new monorepo structure
- Bumped minimum WPGraphQL and WPGatsby versions because latest WPGraphQL (v0.14.0) introduced a breaking change disabling introspection by default. Latest WPGatsby re-enables introspection via a filter. Since you need a minimum WPGatsby version for WPGraphQL 0.14.0 to work, this package set those 2 versions to minimum as a breaking change to reduce confusion when upgrading packages.

## 1.7.9

- Add empty index.js to the root of the project to fix lerna errors that the last release introduced

## 1.7.8

- Increase supported version range for WPGatsby to allow >0.4.14 <0.6.0
- Updated project build setup to build to `dist` instead of to the project root.

## 1.7.7

- Added structure error reports courtesy of @sslotsky. Thanks Sam!

- Moved the check for wether the remote API is using WPGatsby or not to make it more consistent. It was running in parallel with some other checks and sometimes the others would finish first producing incorrect error messages.

In `src/steps/check-plugin-requirements.js`, `isWpGatsby()`

- Updated the error message url for downloading WPGatsby when it's not active

## 1.7.6

- There was a timing issue in that if 'fetchMediaItemsById' (steps/source-nodes/fetch-nodes/fetch-referenced-media-items.js)
  is called a 2nd time before the first batch completes the call to pushPromiseOntoRetryQueue overwrites keys from the first batch as the key is only an index. Then the first instance item never resolves and they all timeout.

## 1.7.5

### Bug Fixes

- The delete node action was missing an import resulting in errors when deleting posts.

## 1.7.4

### Bug Fixes

- The remote file downloader progress bar used to glitch due to some custom code that attempted to keep the same progress bar around for the entirety of node sourcing. To fix the glitchiness clearing the bar is now promise based.

## 1.7.3

## Bug Fixes

- Protect against undefined values in process-node.jsL719

## 1.7.2

### Bug Fixes

- When detecting images in html and transforming them to Gatsby images, any url which had query params was being missing. For example image.jpeg?w=1024.

## 1.7.1

### Bug Fixes

- Fields which had no name were causing errors. These fields are now silently excluded as they can't be used.

## 1.7.0

### New Features

- 404 images will no longer fail the build during `gatsby develop` but will continue to fail the build in production builds.
- Media item fetch errors now include the name of the parent step in which the MediaItem File node was being fetched.
- When fetching html media item files, non-404 error codes now return more helpful information about which media item is having the problem.
- 404ing images in production now have an extra line to the error message explaining that the build failed to prevent deploying a broken site.

### Changes

- MediaItem.remoteFile has been deprecated for a few months, querying for it now throws an error.

## 1.6.3

### Bug Fixes

- The new `options.html.createStaticFiles` option wasn't properly matching css background images in some cases

## 1.6.2

### Bug Fixes

- On later versions of node, the `got` package was erroring when fetching media items when a site used basic httaccess authentication. This was due to a deprecated option. Basic auth headers were added via the headers option instead.

## 1.6.1 was an accidental publish :scream:

## 1.6.0

### New Features

- A new plugin option `options.html.createStaticFiles` was added. When this is `true`, any url's which are wrapped in "", '', or () and which contain `/wp-content/uploads` will be transformed into static files and the url's will be rewritten. This adds support for <audio>, <video>, and <a> tags which point at WP media item uploads as well as inline-html css like background-image: url(). It will also transform any plain text like "https://yoursite.com/wp-content/uploads/image.png" as long as it's wrapped in "", '', or ().

### Changes

- Connected media item id's are analyzed in non media item nodes to determine which nodes to fetch. That was previously being done by finding connections that had an `id` and a `sourceUrl` field on the fetched node data. This was switched to use `id` and `__typename` to save bytes across the wire, slightly reduce the number of db lookups that need to be done on the WPGQL side during node sourcing, and prevent the `createStaticFiles` option from detecting and transforming `sourceUrl` fields.

## 1.5.4

### Bug Fixes

- the `options.type[typename]type.beforeChangeNode` api was not running when creating all nodes, just when updating nodes. This now runs before all node updates (create, update, delete).
- When replacing images with Gatsby images in html fields, only the first instance of an image was being replaced if there were more than 1 identical HTML <img /> strings.

## 1.5.3

### Bug Fixes

- In some cases, an attempt to iterate over `undefined` was occurring and throwing errors.
- When using the writeQueriesToDisk debugging option, old types were not being removed before new ones were generated. This means types that no longer existed in your schema would hang around there forever.

## 1.5.2

### Bug Fixes

- MediaItem sourceUrl's that were encoded on the server were being double encoded and producing a 404 error when the image really did exist. Now there's a check to see if the sourceUrl is already encoded, and is only encoded if it hasn't already been by the server.

## 1.5.1

### Bug Fixes

- The boot up blank get request to WPGraphQL to find debug messages didn't account for situations where debug mode wasn't enabled. That's now accounted for. For example if you install WPGraphQL for CPTUI and don't configure your post types properly, we were missing those errors. The plugin now fails the build with the start up errors.

## 1.5.0

### New Features

- Added `options.develop.hardCacheData` plugin option. This option allows hard caching data between Gatsby cache clears in development. This will speed up development when installing npm packages or modifying gatsby-node. Normally doing either of those things would mean you have to re-fetch all data. This experimental option syncs the data cache outside of the Gatsby cache to help streamline development.

## 1.4.6

### Bug Fixes

- Fixed a bug where a Preview safeguard was preventing the usage of Preview with bedrock/roots (or any other setup that requires the gql endpoint to be used as /?graphql).

## 1.4.5

### Bug Fixes

- In situations where MediaItem.sourceUrl is returned as an absolute path without the WP url, File nodes were unable to be fetched from MediaItem nodes because the URL was wrong.
- Images with `-scaled` as part of the sourceUrl were cached properly but were not being restored from the cache properly when html url's included the full size url instead of the `-scaled` url.
- There was duplicative cache logic running for media item node id's which was unneccessary.

## 1.4.4

- Improved the compatibility API error message to make it clearer that you may need to upgrade OR downgrade WPGraphQL, WPGatsby, or gatsby-source-wordpress-experimental

## 1.4.3

- Added a warning in the terminal output if pretty permalinks are not enabled in WP.

## 1.4.2

- Fixed a race condition / logic error in Gatsby image html processing. Thanks for PR #158 @rburgst!

## 1.4.1

- Added support for WPGraphQL ~0.13.0

## 1.4.0

### New Features

- Previously not all nodes were being fetched in flat lists. This meant extra logic was being run to recursively fetch category nodes, and it meant that custom taxonomies could not have hierarchical data. All core nodes are now fetched as flat lists, enabling hierarchical custom taxonomies and speeding up data sourcing for Category nodes.

## 1.3.10

### Bug Fixes

- Gatsby image's in html blocks were not always being picked up or cached properly.

## 1.3.9

### Bug Fixes

- JSON encoded strings as fields were being processed for <img> tags while gatsby-image in html transformations were taking place. This caused errors and shouldn't have been happening in the first place. This release excludes JSON encoded img src's from being processed.
- The WPGQL Node type is an interface type of all possible WPGQL node types. Since not all of those are Gatsby node types, fields of this type were not being registered properly as Gatsby node connections. This PR adds a check to the default resolver to see if a connected node exists as well as adding the \_\_typename field to all interface fields during query generation and node sourcing. This means connections of the Node type work properly in Gatsby.

## 1.3.8

### Bug Fixes

- Enum type fields were not being picked up by this plugin prior to this release.

## 1.3.7

### Bug Fixes

- When using https hosting but the WordPress general settings url is set to http, images and other links may still point to https. This was causing images to not be picked up and transformed into Gatsby imgs. This release provides a warning and safeguards against this by not comparing the protocol when determining wether an image should be fetched or not.

## 1.3.6

### Bug Fixes

- Root field types could not have their fields excluded previously. This now works!
- In build step error messages, depending on which step errored, undefined.stepName would be printed.

### New Error Messages

- Added an error message for when a GraphQL request returns an empty string "". Fails prod builds and warns in develop.
- debugMessages are now checked for on startup. This will fail the build if there are multiple fields on a type which have the same fieldname for example.

## 1.3.4

### Bug Fixes

- The delta update retry reconnection logic had an off by one error, causing the error log to occasionally say "reconnected after 0 retries".

### New Features

- Previously, the delta update retry reconnection logic was hardcoded to wait 30 seconds when attempting to reconnect. Now it starts at 5 seconds and increases in multiples of 5 seconds until it gets to 60 seconds, then keeps attempting to reconnect after 60 seconds perpetually afterwards.

## 1.3.3

### Bug Fixes

- In our logs, chalk.white.bgBlue() was changed to chalk.bgBlue.white() to support light coloured themes. Previously there wasn't enough contrast when a light theme was enabled.

## 1.3.2

### Bug Fixes

- fixed case where schema customization might fail if a type had no subfields

## 1.3.1

### Bug Fixes

- Fixed default resolver for auto aliased fields in the case that the field type is nested in ofType.
  https://github.com/GatsbyWPGutenberg/gatsby-wordpress-gutenberg/issues/44
  https://github.com/gatsbyjs/gatsby-source-wordpress-experimental/issues/79

## 1.3.0

### New Features

- Tested WPGraphQL v0.12.0 and adjusted the compatibility API to allow it.

## 1.2.7

### Bug Fixes

- Fixed a regression where htaccess headers were not being properly passed to image file requests when they should be.

## 1.2.6

### Bug Fixes

- Errors with no errorContext object would sometimes print "false", this now prints an empty string instead, followed by the proper error.

## 1.2.5

### Bug Fixes

- Removed some debugging code that made it to master 😱

### New Features

- Improved the error displayed when a GraphQL request is redirected or when a PHP WP filter adds additional output to a GraphQL request

## 1.2.4

### Bug Fixes

- Previously when in `gatsby develop` or in a Preview instance, if the connection to WP went down for a moment it would fail the build. It now displays an activity timer with the number of times it's retried, and then a success message when it finally does succeed.

## 1.2.3

### New Features

- Added logic to receive delta updates for non-node root fields like options and settings. Requires WPGatsby v0.4.15 to work, but nothing bad will happen if you don't update WPGatsby, you just wont get any delta updates for these fields until you do.

## 1.2.2

### Bug Fixes

- htaccess auth headers were being passed to all media item file urls regardless of wether that url was the WP url or another url (like s3). This was causing 400 errors in some cases as the 3rd party server considered these headers malformed. This is now fixed.

## 1.2.1

### New Features

- Updated Schema compatibility so that WPGraphQL v0.11.0 will be supported.

## 1.2.0

### New Features

- Added Date resolver to `modified` `modifiedGmt` and `dateGmt` fields (#83)

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
