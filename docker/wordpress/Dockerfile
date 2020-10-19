FROM wordpress:5.5

ARG WPGRAPHQL_VERSION=v0.13.1
ARG WPGATSBY_VERSION=v0.5.2
ARG WPGRAPHQL_ACF_VERSION=v0.3.1
ARG WPGRAPHQL_CPT_UI_VERSION=v1.1
ARG ACF_VERSION=v5.8.7
ARG PLUGIN_DIR=/usr/src/wordpress/wp-content/plugins

LABEL maintainer="duffn@outlook.com" 

# Set timezone, install XDebug, PHP Composer, WP-CLI
RUN echo 'date.timezone = "UTC"' > /usr/local/etc/php/conf.d/timezone.ini \
  && apt-get update && apt-get install git -y \
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

# WP GraphQL from github release
RUN install-plugin wp-graphql wp-graphql/wp-graphql ${WPGRAPHQL_VERSION}

ARG PLUGIN_DIR=/usr/src/wordpress/wp-content/plugins
# Install wp-gatsby using git, and apply a diff
RUN git clone https://github.com/gatsbyjs/wp-gatsby ${PLUGIN_DIR}/wp-gatsby

# WP GraphQL ACF from github release
RUN install-plugin wp-graphql-acf wp-graphql/wp-graphql-acf ${WPGRAPHQL_ACF_VERSION}

# WP GraphQL CPTUI from github release
RUN install-plugin wp-graphql-custom-post-type-ui wp-graphql/wp-graphql-custom-post-type-ui ${WPGRAPHQL_CPT_UI_VERSION}

RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/local/bin/wait-for-it \
  && chmod +x /usr/local/bin/wait-for-it

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

RUN git clone --depth 1 -b ${ACF_VERSION} https://github.com/wp-premium/advanced-custom-fields-pro.git ${PLUGIN_DIR}/advanced-custom-fields-pro

RUN git clone --depth 1 https://github.com/WP-API/Basic-Auth.git ${PLUGIN_DIR}/basic-auth

RUN apt-get remove git -y

RUN chown -R www-data:www-data wp-content && chmod -R 777 wp-content;

EXPOSE 8001

CMD ["wait-for-it", "-t", "40", "db:3306", "--", "/usr/local/bin/start.sh"]


