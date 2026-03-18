FROM node:20-alpine

# set wp working directory
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY ./tools/init.sh /init.sh
RUN chmod +x /init.sh

# NETWORKING
EXPOSE 3000

ENTRYPOINT [ "/init.sh" ]