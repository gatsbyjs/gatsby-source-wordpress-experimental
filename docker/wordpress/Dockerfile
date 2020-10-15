FROM wordpress:5.5

ARG WPGRAPHQL_VERSION=v0.13.3
ARG WPGATSBY_VERSION=v0.4.17
ARG YOAST_GRAPHQL_VERSION=v4.8.0
ARG WPGRAPHQL_GUTENBERG_VERSION=v0.3.4
ARG WPGRAPHQL_ACF_VERSION=v0.3.5

LABEL maintainer="duffn@outlook.com" 

# Set timezone, install XDebug, PHP Composer, WP-CLI
RUN echo 'date.timezone = "UTC"' > /usr/local/etc/php/conf.d/timezone.ini \
  && rm -rf /var/lib/apt/lists/* \
  && pecl install xdebug \
  && docker-php-ext-enable xdebug \
  && docker-php-ext-install pdo_mysql \
  && curl -Ls 'https://raw.githubusercontent.com/composer/getcomposer.org/fc4099e0ac116a1c8f61fffaf6693594dda79d16/web/installer' | php -- --quiet \
  && chmod +x composer.phar \
  && mv composer.phar /usr/local/bin/composer \
  && curl -O 'https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar' \
  && chmod +x wp-cli.phar \
  && mv wp-cli.phar /usr/local/bin/wp


COPY install-plugin.sh /usr/local/bin/install-plugin

# WP GraphQL
RUN install-plugin wp-graphql wp-graphql/wp-graphql ${WPGRAPHQL_VERSION}

# WP Gatsby
RUN install-plugin wp-gatsby gatsbyjs/wp-gatsby ${WPGATSBY_VERSION}

# WP GraphQL Gutenberg
RUN install-plugin wp-graphql-gutenberg pristas-peter/wp-graphql-gutenberg ${WPGRAPHQL_GUTENBERG_VERSION}

# WP GraphQL Gutenberg
RUN install-plugin wp-graphql-acf wp-graphql/wp-graphql-acf ${WPGRAPHQL_ACF_VERSION}

# WP GraphQL Gutenberg
RUN install-plugin wp-graphql-yoast-seo ashhitch/wp-graphql-yoast-seo ${YOAST_GRAPHQL_VERSION}

RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/local/bin/wait-for-it \
  && chmod +x /usr/local/bin/wait-for-it

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# # WP GraphQL ACF
# RUN composer require wp-graphql/wp-graphql-acf --version ${WPGRAPHQL_ACF_VERSION}

# # YOAST
# RUN composer require ashhitch/wp-graphql-yoast-seo --version ${YOAST_GRAPHQL_VERSION}

RUN mkdir -p /usr/src/wordpress/wp-content/plugins/basic-auth
RUN curl https://raw.githubusercontent.com/WP-API/Basic-Auth/master/basic-auth.php -o /usr/src/wordpress/wp-content/plugins/basic-auth/basic-auth.php
RUN curl https://raw.githubusercontent.com/WP-API/Basic-Auth/master/composer.json -o /usr/src/wordpress/wp-content/plugins/basic-auth/composer.json

RUN chown -R www-data:www-data wp-content && chmod -R 777 wp-content;

EXPOSE 8001

CMD ["wait-for-it", "db:3306", "--", "/usr/local/bin/start.sh"]


