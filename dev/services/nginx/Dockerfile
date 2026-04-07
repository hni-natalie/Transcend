FROM alpine:3.22.3

# Install packages
# nginx  : webserver
# openssl: for https
# gettext: for envsubst
RUN apk update && apk add --no-cache \
    nginx \
    openssl \
    gettext \
    && rm -rf /var/cache/apk/*

# Create directories
RUN mkdir -p /etc/nginx/ssl \
    && mkdir -p /run/nginx  
	# Alpine needs this for nginx pid

# Copy config files
COPY ./conf/nginx.prod.conf /etc/nginx/nginx.conf.template
COPY --chmod=755 ./tools/init.sh /init.sh

# 443  : for https
# 7881 : for livekit tcp_port
# 7882 : for livekit udp_port
EXPOSE 443 7881 7882

ENTRYPOINT ["/init.sh"]