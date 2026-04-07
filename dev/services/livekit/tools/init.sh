#!/bin/sh

# exits if any command fails
set -e

# read secrets
_LIVEKIT_KEY=$(cat /run/secrets/livekit_api_key)
_LIVEKIT_SECRET=$(cat /run/secrets/livekit_api_secret)
_REDIS_PWD=$(cat /run/secrets/redis_pwd)

echo "> Initializing env in config.yaml ..."
REDIS_PWD="$_REDIS_PWD" LIVEKIT_API_KEY="$_LIVEKIT_KEY" LIVEKIT_API_SECRET="$_LIVEKIT_SECRET" envsubst '${REDIS_PWD} ${LIVEKIT_API_KEY} ${LIVEKIT_API_SECRET} ${LIVEKIT_UDP_START} ${LIVEKIT_UDP_END}' < /etc/livekit/config.yaml.template > /etc/livekit/config.yaml

# debug
# cat /etc/livekit/config.yaml

echo "> Initialization done, starting livekit server"
exec "$@"