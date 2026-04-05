#!/bin/bash
set -e

DB_ROOT_PASS=$(cat /run/secrets/db_root)
DB_USER_PASS=$(cat /run/secrets/db_user)

if [ ! -e /var/lib/mysql/.firstmount ]; then
    echo "Initializing MariaDB database..."

    mariadb-install-db \
        --user=mysql \
        --basedir=/usr \
        --datadir=/var/lib/mysql \
        --skip-test-db \
        >/dev/null 2>&1

    # Write all SQL to a temp init file - runs before any auth is enforced
    cat > /tmp/init.sql <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${DB_ROOT_PASS}');
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_USER_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
USE ${DB_NAME};
$(cat /docker-entrypoint-initdb.d/init.sql)
$(cat /docker-entrypoint-initdb.d/seed.sql)
EOF

    # Start with init file - SQL runs at startup before accepting connections
    mariadbd-safe --user=mysql --init-file=/tmp/init.sql &

    until [ -S /var/run/mysqld/mysqld.sock ]; do
        echo "Waiting for socket..."
        sleep 1
    done

    until mariadb -u root -p"${DB_ROOT_PASS}" --socket=/var/run/mysqld/mysqld.sock -e "SELECT 1;" 2>/dev/null; do
        echo "MariaDB not started yet..."
        sleep 1
    done

    echo "Init done, shutting down..."
    mariadb-admin -u root -p"${DB_ROOT_PASS}" --socket=/var/run/mysqld/mysqld.sock shutdown

    rm -f /tmp/init.sql
    touch /var/lib/mysql/.firstmount
    echo "MariaDB initialized successfully"
fi

echo "Creating health check flag..."
touch /tmp/database-ready
echo "Starting database..."
exec mariadbd-safe --user=mysql