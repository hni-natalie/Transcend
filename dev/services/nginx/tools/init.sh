#!/bin/sh

# SSL cert/key come from the shared `certs` compose service, mounted at
# /etc/nginx/ssl (same cert used by backend/whisper for internal TLS too).

echo "> Initializing env in nginx.conf ..."
envsubst '${DOMAIN_NAME} ${FRONTEND_PORT} ${BACKEND_PORT} ${LIVEKIT_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "> nginx.conf initialization done!"

echo "> Testing nginx config..."
nginx -t 

echo "> Starting nginx ...."
exec nginx -g 'daemon off;'
