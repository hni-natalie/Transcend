const fs = require('fs');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: fs.readFileSync('/run/secrets/db_user', 'utf8').trim(),
    database: process.env.DB_NAME,
	connectionLimit: 5
});

module.exports = pool;