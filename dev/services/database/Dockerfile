FROM debian:12

RUN apt-get update -y && apt-get upgrade -y \
    && apt-get install -y mariadb-server \
    && rm -rf /var/lib/apt/lists/* 

RUN mkdir -p /var/run/mysqld \
    && chown -R mysql:mysql /var/run/mysqld \
    && chmod 755 /var/run/mysqld

COPY --chmod=755 ./tools/init.sh /init.sh

COPY conf/my.cnf /etc/mysql/mariadb.conf.d/50-server.cnf
COPY tools/init.sql /docker-entrypoint-initdb.d/init.sql
COPY tools/seed.sql /docker-entrypoint-initdb.d/seed.sql

EXPOSE 3306

ENTRYPOINT [ "/init.sh" ]