# -----------------------------------------
# Stage 1: Initialize React app
# -----------------------------------------

FROM node:20-alpine AS builder

# set working directory
WORKDIR /build

COPY --chmod=750 ./tools/build.sh /build.sh
RUN /build.sh
# ENTRYPOINT [ "/build.sh" ]


# -----------------------------------------
# Stage 2: Copy over files & start
# -----------------------------------------
FROM node:20-alpine

WORKDIR /app_build

RUN addgroup -g 501 -S frontend && \
    adduser -S frontend -u 501 -G frontend -s /bin/sh

COPY --from=builder --chown=frontend:frontend /build /app_build

# For development with hot reload
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

USER frontend

WORKDIR /app

COPY --chmod=755 ./tools/init.sh /init.sh

# NETWORKING
EXPOSE 5173

ENTRYPOINT [ "/init.sh" ]