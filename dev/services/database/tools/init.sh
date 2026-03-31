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
	
	echo "Checking for migrations in /migrations..."

	# Use a glob check that won't crash the script
	sql_files=(/migrations/*.sql)

	migrations_failed=0

	if [ ${#sql_files[@]} -gt 0 ] && [ -e "${sql_files[0]}" ]; then
		for f in "${sql_files[@]}"; do
			echo "Applying: $f"
			# Keep the original script resilient, but track failures so we don't mark init as done.
			mariadb -u root -p"${DB_ROOT_PASS}" "${DB_NAME}" < "$f" || { echo "Warning: Failed to run $f"; migrations_failed=1; }
		done
	else
		echo "No migrations found. Skipping..."
	fi

	if [ "$migrations_failed" -ne 0 ]; then
		echo "Migrations failed; not marking DB as initialized."
		exit 1
	fi

	# Mark DB initialized only after migrations succeeded.
	touch /var/lib/mysql/.firstmount

	# Shutdown the temporary server started for init so the container can start mariadbd cleanly.
	mariadb-admin -u root -p${DB_ROOT_PASS} shutdown

	echo "Mariadb Successful"
fi 

echo "Creating health check flag..."
touch /tmp/database-ready
echo "✅ Database ready flag created at /tmp/database-ready"

echo "starting database ..."
exec mariadbd-safe --user=mysql