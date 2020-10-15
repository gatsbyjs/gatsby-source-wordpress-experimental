#!/bin/bash

set -e

if ! $(wp core is-installed); then
  wp core install \
    --path="/var/www/html" \
    --url="http://localhost:8001" \
    --title="Gatsby & WordPress" \
    --admin_user=admin \
    --admin_password=secret \
    --admin_email=foo@bar.com

  # install plugins that the wpgraphql plugins build on
  wp plugin install woocommerce bbpress gutenberg advanced-custom-fields wordpress-seo

  # activate plugins
  wp plugin activate basic-auth woocommerce \
   gutenberg wordpress-seo advanced-custom-fields bbpress wp-graphql \
   wp-gatsby wp-graphql-yoast-seo \
   wp-graphql-gutenberg wp-graphql-acf
  
  # set path rewrite structure
  wp rewrite structure '/%year%/%monthnum%/%day%/%postname%/' 
else
  echo "WordPress is already installed."
fi
