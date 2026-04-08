FROM node:20-alpine

# set working directory
WORKDIR /app

RUN apk add --no-cache postgresql-client openssl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs -s /bin/sh

COPY --chmod=750 ./tools/init.sh /init.sh

# NETWORKING
EXPOSE 3000

ENTRYPOINT [ "/init.sh" ]