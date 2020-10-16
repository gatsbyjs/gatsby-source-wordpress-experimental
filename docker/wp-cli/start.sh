#!/bin/bash
set -e

echo "heyyyy"

echo "heyyyy"
wp core install \
    --path="/var/www/html" \
    --url="http://localhost:8001" \
    --title="Gatsby & WordPress" \
    --admin_user=admin \
    --admin_password=secret \
    --admin_email=admin@admin.com

wp search-replace 'https://gatsbyinttests.wpengine.com' 'http://localhost:8081'

wp user update admin --user_pass="secret"
# install plugins that the wpgraphql plugins build on
wp plugin install gutenberg advanced-custom-fields wordpress-seo

# activate plugins
wp plugin activate advanced-custom-fields basic-auth gutenberg wordpress-seo wp-graphql

wp plugin activate wp-graphql-yoast-seo \
  wp-graphql-gutenberg wp-graphql-acf

wp plugin activate wp-gatsby

# set path rewrite structure
wp rewrite structure '/%year%/%monthnum%/%day%/%postname%/'

wp cache flush

wp plugin upadte advanced-custom-fields wp-graphql-acf
