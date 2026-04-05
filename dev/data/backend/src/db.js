const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT || 5432,
	database: process.env.DB_NAME,
	user: fs.readFileSync('/run/secrets/db_user', 'utf8').trim(),
	password: fs.readFileSync('/run/secrets/db_root', 'utf8').trim(),
	max: 5
})

pool.connect()
        .then(() => console.log('✅ Postgres connected'))
        .catch((err) => console.error('❌ DB connection error:', err))

module.exports = pool
