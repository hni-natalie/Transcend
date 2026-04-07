# Build stage
FROM alpine:3.22.3 AS builder

RUN apk add --no-cache \
    gcc \
    make \
    musl-dev \
    linux-headers \
    jemalloc-dev \
    wget

WORKDIR /tmp

RUN wget https://download.redis.io/releases/redis-7.2.5.tar.gz && \
    tar xzf redis-7.2.5.tar.gz && \
    cd redis-7.2.5 && \
    make MALLOC=libc && \
    make install

# Runtime stage
FROM alpine:3.22.3

# # Install runtime dependencies only
RUN apk add --no-cache libc6-compat gettext-envsubst

# Copy built binaries from builder
COPY --from=builder /usr/local/bin/redis-server /usr/local/bin/
COPY --from=builder /usr/local/bin/redis-cli /usr/local/bin/

# Create redis user and directories
RUN adduser -D -u 501 redis && \
    mkdir -p /data /etc/redis /var/run && \
    chown redis:redis /data /etc/redis /var/run

WORKDIR /data

COPY --chmod=650 --chown=redis:redis ./conf/redis.conf /etc/redis/redis.conf.template
COPY --chmod=750 --chown=redis:redis ./tools/init.sh /init.sh

USER redis

EXPOSE 6379

ENTRYPOINT [ "/init.sh" ]
CMD ["redis-server", "/etc/redis/redis.conf"]