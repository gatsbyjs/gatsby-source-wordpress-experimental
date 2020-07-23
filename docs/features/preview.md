# Preview

This plugin supports [Preview](https://www.gatsbyjs.com/preview/) and has been designed to replicate the normal WordPress admin preview experience as closely as possible.



## Setting up Preview

You can find our tutorial on setting up WPGatsby [here](../tutorials/configuring-wp-gatsby.md#setting-up-preview). Part-way down the page there are instructions you can follow on setting up Preview.

__Note__: Previews for brand new posts currently require sending 2 webhooks. 1 when the new draft page is opened and another when the "preview" button is pressed. The reason for this is that the WP preview window opens so quickly that the first preview will show a 404 page if we don't get a blank preview node ready. Work to remedy this is currently underway.



## How Preview works

When the WP "preview" button is pressed, a JWT is generated (with an expiry time of 30 seconds) and POST'ed to the Gatsby Preview instance webhook. The Preview instance then uses this short-lived JWT to request preview data for the page or post that's being previewed. At the same time, WordPress automatically opens the WP preview template which has been overridden by WPGatsby. Within the WP preview template you will see the admin bar at the top of the page as usual, but below that you will see an iframe containing your Gatsby Preview instance opened to the correct page for the current preview.



## Template safety

Be sure to guard against missing data in your templates using optional chaining so that missing data doesn't cause template errors. Trying to access properties on undefined will break your preview. For example, if you try to access `wpPost.acfFieldGroup.hero.content` but your Preview template receives `null` for `wpPost.acfFieldGroup`, your preview template will break. 

To guard against this you can use optional chaining by writing `wpPost?.acfFieldGroup?.hero?.content` instead.



## Debugging Previews

Since a Previewed post might have a lot less data attached to it than what you're testing with during development, you might get errors in previews when that data is missing. You can debug your previews by running Gatsby in preview mode locally.

- Run Gatsby in refresh mode with `ENABLE_GATSBY_REFRESH_ENDPOINT=true gatsby develop`
- Install ngrok with `npm i -g ngrok`
- In a new terminal window run `ngrok http 8000`
- In your WP instance's GatsbyJS settings, set your Preview instance URL to `https://your-ngrok-url.ngrok.io` and your Preview webhook to `https://your-ngrok-url.ngrok.io/__refresh`

Now when you click the preview button in `wp-admin` it will use your local instance of Gatsby. You can inspect the preview template to see which Gatsby page is being loaded in the preview iframe and open it directly to do further debugging.



:point_left: [Back to Features](./index.md)
