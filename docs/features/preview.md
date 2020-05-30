# Preview

Once configured in the GatsbyJS settings page in wp-admin, Previews will work out of the box.

To get started, setup a Preview instance on [Gatsby Cloud](https://www.gatsbyjs.com/) or on your [self-hosted Preview instance](https://www.gatsbyjs.org/docs/running-a-gatsby-preview-server/), then take your preview URL and add it to your WP instance.

The preview settings page can be found under `wp-admin->Settings->GatsbyJS->"Preview Webhook"`.

If you don't see this settings page, make sure WPGatsby is installed on your WordPress instance.



## Template safety

Be sure to guard against missing data in your templates using optional chaining so that missing data doesn't cause template errors. Trying to access properties on undefined will break your preview. For example, if you try to access `wpPost.acfFieldGroup.hero.content` but your Preview template receives `null` for `wpPost.acfFieldGroup`, your preview template will break. 

To guard against this you can use optional chaining by writing `wpPost?.acfFieldGroup?.hero?.content` instead.



## Caveats

Since WP currently only revisions titles and post content, the same is true for WPGraphQL. Soon ACF revision support will be added and any unrevisioned data/meta will be pulled from the main post of the revision (for ex for featured images). What this means is your previews will only contain title and post content data. This will soon be improved/fixed once WPGraphQL supports this.