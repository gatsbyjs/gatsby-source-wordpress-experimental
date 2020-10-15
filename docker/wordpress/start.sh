#!/bin/bash

set -e

# This seems goofy
sed -i "s/Listen 80$/Listen 8001/g" /etc/apache2/ports.conf
sed -i "s/80>$/8001>/g" /etc/apache2/sites-available/000-default.conf 
docker-entrypoint.sh apache2-foreground
