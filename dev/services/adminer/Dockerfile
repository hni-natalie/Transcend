FROM debian:12

RUN apt-get update && apt-get install -y \
    adminer \
    php \
    php-mysql \
    php-gd \
    php-curl \
    php-mbstring \
    php-xml \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/share/adminer

EXPOSE 8080

# php: program run the PHP interpreter 
# -S: tells PHP to start its built-in web server 
# 0.0.0.0:8080: listen on all network interfaces and listen to 8080 inside the container
# adminer.php: file PHP will serve as the website 
ENTRYPOINT ["php", "-S", "0.0.0.0:8080", "adminer.php"]