FROM node:20-alpine

# set working directory
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs -s /bin/sh

COPY ./tools/init.sh /init.sh
RUN chmod +x /init.sh

# NETWORKING
EXPOSE 3000

ENTRYPOINT [ "/init.sh" ]