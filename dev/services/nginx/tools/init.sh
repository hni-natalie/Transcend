#!/bin/sh

echo "> creating SSL certificates ..."

# req			: req cert creation
# -x509		: skip cert authority,self-sign cert instead (.crt) | else (.csr)
# -nodes	: skip password for key
# -days		: valid days
# -newkey	rsa:2048: ignore existing key, gen new key using rsa algo,size 2048
# -keyout	: save private key path
# -out		: save cert path
# -subj		: cert title
if [ ! -f "/etc/nginx/ssl/${DOMAIN_NAME}.crt" ]; then
	openssl req -x509 -nodes -days 365 \
	-newkey rsa:2048 \
	-keyout /etc/nginx/ssl/${DOMAIN_NAME}.key \
	-out /etc/nginx/ssl/${DOMAIN_NAME}.crt \
	-subj "/C=MY/ST=Selangor/L=PetalingJaya/O=42KL/CN=${DOMAIN_NAME}"
	echo "> SSL certicate generated!"
else
	echo "> SSL certificate exists! Skipping ..."
fi

echo "> Initializing env in nginx.conf ..."
envsubst '${DOMAIN_NAME} ${FRONTEND_PORT} ${BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "> nginx.conf initialization done!"

echo "> Testing nginx config..."
nginx -t 

echo "> Starting nginx ...."
exec nginx -g 'daemon off;'
