const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    let conn;

    try {
        const password = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();

        conn = await pool.getConnection();

        const rows = await conn.query(
            'SELECT 1 FROM user WHERE role_id = 1 LIMIT 1'
        );

        if (rows.length > 0) {
            console.log('Admin already exists');
            return;
        }

        const hash = await bcrypt.hash(password, 10);

        await conn.query(
            'INSERT INTO user (user_name, user_email, user_password, role_id) VALUES (?, ?, ?, ?)',
            [process.env.WF_ADMIN_USER, process.env.WF_ADMIN_EMAIL, hash, 1]
        );

        console.log('Admin user created');

    } catch (err) {
        console.error('Seed error:', err.message);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = seedAdmin;