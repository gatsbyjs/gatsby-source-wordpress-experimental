FROM wordpress:cli-php7.4

USER root

RUN mkdir -p /etc/X11/fs/.wp-cli/cache

RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/local/bin/wait-for-it \
  && chmod +x /usr/local/bin/wait-for-it

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

USER xfs

CMD ["wait-for-it", "wordpress:8001", "--", "/usr/local/bin/start.sh"]
