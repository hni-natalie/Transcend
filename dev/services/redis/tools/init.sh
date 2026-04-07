#!/bin/sh

# exits if any command fails
set -e

# read secrets
_REDIS_PWD=$(cat /run/secrets/redis_pwd)

echo "> Initializing env in redis.conf ..."
REDIS_PWD="$_REDIS_PWD" envsubst '${REDIS_PWD}' < /etc/redis/redis.conf.template > /etc/redis/redis.conf

echo "> Initialization done, starting redis server"
exec "$@"