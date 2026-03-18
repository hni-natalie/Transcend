# -----------------------------------------
# Stage 1: Initialize React app
# -----------------------------------------

FROM node:20-alpine

# set working directory
WORKDIR /app

# RUN addgroup -g 1000 -S frontend && \
#     adduser -S frontend -u 1000 -G frontend -s /bin/sh

# For development with hot reload
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY ./tools/init.sh /init.sh
RUN chmod +x /init.sh

# NETWORKING
EXPOSE 5173

ENTRYPOINT [ "/init.sh" ]