const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed (upsert mode - safe for production)...');

    // Create or get roles (upsert)
    const adminRole = await prisma.roles.upsert({
        where: { role_name: 'Admin' },
        update: {},
        create: { role_name: 'Admin' }
    });

    const userRole = await prisma.roles.upsert({
        where: { role_name: 'User' },
        update: {},
        create: { role_name: 'User' }
    });

    // Create or get departments (upsert)
    const hrDept = await prisma.Department.upsert({
        where: { dpName: 'Human Resources' },
        update: {},
        create: { dpName: 'Human Resources' }
    });
    
    const acDept = await prisma.Department.upsert({
        where: { dpName: 'Accounts' },
        update: {},
        create: { dpName: 'Accounts' }
    });
    
    const mkDept = await prisma.Department.upsert({
        where: { dpName: 'Marketing' },
        update: {},
        create: { dpName: 'Marketing' }
    });

    // Create or update admin user (upsert)
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.users.upsert({
        where: { user_email: 'superuser@workfrom.com' },
        update: {
            user_password: adminHash,  // Update if password changed
            user_name: 'Administrator',
            user_status: 'online',
        },
        create: {
            user_email: 'superuser@workfrom.com',
            user_password: adminHash,
            user_name: 'Administrator',
            user_status: 'online',
            role_id: adminRole.role_id,
            dp_id: hrDept.dpId,
            auth_provider: 'email',
            email_verified: true,
        }
    });

    // Create or update accounts user
    const userPassword = fs.readFileSync('/run/secrets/app_user', 'utf8').trim();
    const userHash = await bcrypt.hash(userPassword, 10);
    
    const acUser = await prisma.users.upsert({
        where: { user_email: 'user1@workfrom.com' },
        update: {
            user_password: userHash,
            user_name: 'John Doe',
        },
        create: {
            user_email: 'user1@workfrom.com',
            user_password: userHash,
            user_name: 'John Doe',
            user_status: 'offline',
            role_id: userRole.role_id,
            dp_id: acDept.dpId,
            auth_provider: 'email',
            email_verified: true,
        }
    });

    // Create or update marketing user
    const mkUser = await prisma.users.upsert({
        where: { user_email: 'user2@workfrom.com' },
        update: {
            user_password: userHash,
            user_name: 'Mary Jane',
        },
        create: {
            user_email: 'user2@workfrom.com',
            user_password: userHash,
            user_name: 'Mary Jane',
            user_status: 'busy',
            role_id: userRole.role_id,
            dp_id: mkDept.dpId,
            auth_provider: 'email',
            email_verified: false,
        }
    });

    // Update department leads (always update to ensure correct)
    await prisma.Department.update({
        where: { dpId: hrDept.dpId },
        data: { dpLead: admin.user_id }
    });
    
    await prisma.Department.update({
        where: { dpId: acDept.dpId },
        data: { dpLead: acUser.user_id }
    });
    
    await prisma.Department.update({
        where: { dpId: mkDept.dpId },
        data: { dpLead: mkUser.user_id }
    });

    console.log('Seed completed (idempotent - safe to run multiple times)!');
}
