# FROM debian:bookworm

# # INSTALLATION
# # nginx 	 		: webserver
# # openssl			: for https
# # gettext-base: for envsubst
# RUN apt-get update && apt-get install -y \
# 	nginx \
# 	openssl \
# 	gettext-base \
# 	&& rm -rf /var/cache/apk/*

# # create dir once
# RUN mkdir -p /etc/nginx/ssl

# # use own nginx & init script
# COPY ./conf/nginx.conf /etc/nginx/nginx.conf.template
# COPY ./tools/init.sh /init.sh

# RUN chmod +x /init.sh

# EXPOSE 443

# # 
# # ENTRYPOINT [ "/init.sh" ]


FROM alpine:3.22.3

# Install packages
# nginx: webserver
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

# Copy configuration files
COPY ./conf/nginx.conf /etc/nginx/nginx.conf.template
COPY ./tools/init.sh /init.sh

# Make init script executable
RUN chmod +x /init.sh

EXPOSE 443

ENTRYPOINT ["/init.sh"]