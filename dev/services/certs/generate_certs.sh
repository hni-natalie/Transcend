#!/bin/sh

set -e
echo "> creating SSL certificates ..."

# req			: req cert creation
# -x509		: skip cert authority,self-sign cert instead (.crt) | else (.csr)
# -nodes	: skip password for key
# -days		: valid days
# -newkey	rsa:2048: ignore existing key, gen new key using rsa algo,size 2048
# -keyout	: save private key path
# -out		: save cert path
# -subj		: cert title
if [ ! -f "/etc/certs/${DOMAIN_NAME}.crt" ]; then
	openssl req -x509 -nodes -days 365 \
	-newkey rsa:2048 \
	-keyout /etc/certs/${DOMAIN_NAME}.key \
	-out /etc/certs/${DOMAIN_NAME}.crt \
	-subj "/C=MY/ST=Selangor/L=PetalingJaya/O=42KL/CN=${DOMAIN_NAME}"
	echo "> SSL certicate generated!"
else
	echo "> SSL certificate exists! Skipping ..."
fi

# Set proper ownership for appuser
chown -R 1001:1001 /etc/certs
chmod 644 /etc/certs/*