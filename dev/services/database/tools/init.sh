#!/bin/bash
set -e

# Retrieve sensitive data 
DB_ROOT_PASS=$(cat /run/secrets/db_root)
DB_USER_PASS=$(cat /run/secrets/db_user)

if [ ! -e /var/lib/mysql/.firstmount ]; then
    echo "Initializing MariDB database..."
    
    mariadb-install-db \
			--user=mysql \
	        --basedir=/usr \
	        --datadir=/var/lib/mysql \
	        --auth-root-authentication-method=socket \
	        --skip-test-db \
	        >/dev/null 2>&1

    mariadbd-safe --user=mysql &

    until mariadb -u root -e "SELECT 1;" >/dev/null 2>&1; do
        echo "MariaDB not started yet..."
        sleep 1
    done

	mariadb -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME}"
	mariadb -e "CREATE USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_USER_PASS}';"
	mariadb -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';"
	mariadb -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';"
	mariadb -u root -p${DB_ROOT_PASS} -e "FLUSH PRIVILEGES;"
	mariadb-admin -u root -p${DB_ROOT_PASS} shutdown

    touch /var/lib/mysql/.firstmount

	echo "Mariadb Successful"
fi 

echo "Creating health check flag..."
touch /tmp/database-ready
echo "✅ Database ready flag created at /tmp/database-ready"

echo "starting database ..."
exec mariadbd-safe --user=mysql