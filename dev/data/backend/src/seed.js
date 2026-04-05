const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcrypt');

async function seedAdmin() {
    try {
        const password = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();

        const existing = await pool.query(
            'SELECT 1 FROM users WHERE role_id = 1 LIMIT 1'
        );
        if (existing.rows.length > 0) {
            console.log('Admin already exists');
            return;
        }

        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (user_name, user_email, user_password, role_id) VALUES ($1, $2, $3, $4)',
            [process.env.WF_ADMIN_USER, process.env.WF_ADMIN_EMAIL, hash, 1]
        );
        console.log('Admin user created');
    } catch (err) {
        console.error('Seed error:', err.message);
    }
}

module.exports = seedAdmin;
