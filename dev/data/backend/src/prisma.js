const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Validate secret exists
const SECRET_PATH = '/run/secrets/db_root';
if (!fs.existsSync(SECRET_PATH)) {
    throw new Error(`Database secret not found at ${SECRET_PATH}. Ensure Docker secret 'db_password' is mounted.`);
}

// Read password
const dbPassword = fs.readFileSync(SECRET_PATH, 'utf8').trim();

if (!dbPassword) {
    throw new Error('Database password secret is empty');
}

// Database configuration - set these via environment variables or hardcode
const dbUser = process.env.DB_USER || 'dbadmin';
const dbHost = process.env.DB_HOST || 'database';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'workfrom';

const DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

module.exports = prisma;