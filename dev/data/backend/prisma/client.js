const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const SECRET_PATH = '/run/secrets/db_root';
if (!fs.existsSync(SECRET_PATH)) {
    throw new Error(`Database secret not found at ${SECRET_PATH}. Ensure Docker secret 'db_password' is mounted.`);
}

const dbPassword = fs.readFileSync(SECRET_PATH, 'utf8').trim();
const encodedPassword = encodeURIComponent(dbPassword);

if (!dbPassword) {
    throw new Error('Database password secret is empty');
}

const dbUser = process.env.DB_USER;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DATABASE_PORT;
const dbName = process.env.DB_NAME;

const DATABASE_URL = `postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

module.exports = prisma;