const { PrismaClient } = require('@prisma/client')
const secrets = require('../src/utils/secrets')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: secrets.DATABASE_URL,
        },
    },
    log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn', 'info']
        : ['error']
})

module.exports = prisma
