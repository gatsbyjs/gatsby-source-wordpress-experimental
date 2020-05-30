# Schema Merging

- The WPGraphQL and Gatsby GraphQL schemas are automagically merged behind the scenes for you.
- Know that you're querying the Gatsby GraphQL API, but using the schema definitions and data of WPGraphQL. 
  This means you will have the power of both systems!
- Note that currently WPGraphQL input arguments are not supported in this integration
- Automatically pulls as much of the remote WPGQL schema as possible and creates Gatsby nodes from that data. Data is never fetched twice. If we will already have data, for example on a connection field between an Author and a Post, we only pull the id of the Post and link the field to the Post node in Gatsby.
- Potentially works with all (or most) WPGQL plugins. So ACF, polylang, etc will work. See "known issues" below if a plugin doesn't work.