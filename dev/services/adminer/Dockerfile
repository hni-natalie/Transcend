FROM debian:12

RUN apt-get update -o Acquire::https::Verify-Peer=false \
    && apt-get install -y --no-install-recommends ca-certificates \
    && apt-get update \
    && apt-get install -y \
    adminer \
    php \
    php-pgsql \
    php-gd \
    php-curl \
    php-mbstring \
    php-xml \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/share/adminer
EXPOSE 8080
ENTRYPOINT ["php", "-S", "0.0.0.0:8080", "adminer.php"]
