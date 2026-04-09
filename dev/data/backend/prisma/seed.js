const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Roles
    const adminRole = await prisma.role.upsert({
        where: { roleName: 'Admin' },
        update: {},
        create: { roleName: 'Admin' },
    });

    const userRole = await prisma.role.upsert({
        where: { roleName: 'User' },
        update: {},
        create: { roleName: 'User' },
    });

    // Departments
    const hrDept = await prisma.department.upsert({
        where: { dpName: 'Human Resources' },
        update: {},
        create: { dpName: 'Human Resources' },
    });

    const acDept = await prisma.department.upsert({
        where: { dpName: 'Accounts' },
        update: {},
        create: { dpName: 'Accounts' },
    });

    const mkDept = await prisma.department.upsert({
        where: { dpName: 'Marketing' },
        update: {},
        create: { dpName: 'Marketing' },
    });

    // Admin user
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { userEmail: 'superuser@workfrom.com' },
        update: {
        userPassword: adminHash,
        userName: 'Administrator',
        userStatus: 'online',
        },
        create: {
        userEmail: 'superuser@workfrom.com',
        userPassword: adminHash,
        userName: 'Administrator',
        userStatus: 'online',
        roleId: adminRole.roleId,
        dpId: hrDept.dpId,
        authProvider: 'email',
        emailVerified: true,
        },
    });

    // Account user
    const userPassword = fs.readFileSync('/run/secrets/app_user', 'utf8').trim();
    const userHash = await bcrypt.hash(userPassword, 10);

    const acUser = await prisma.user.upsert({
        where: { userEmail: 'user1@workfrom.com' },
        update: {
        userPassword: userHash,
        userName: 'John Doe',
        },
        create: {
        userEmail: 'user1@workfrom.com',
        userPassword: userHash,
        userName: 'John Doe',
        userStatus: 'offline',
        roleId: userRole.roleId,
        dpId: acDept.dpId,
        authProvider: 'email',
        emailVerified: true,
        },
    });

    // Marketing user
    const mkUser = await prisma.user.upsert({
        where: { userEmail: 'user2@workfrom.com' },
        update: {
        userPassword: userHash,
        userName: 'Mary Jane',
        },
        create: {
        userEmail: 'user2@workfrom.com',
        userPassword: userHash,
        userName: 'Mary Jane',
        userStatus: 'busy',
        roleId: userRole.roleId,
        dpId: mkDept.dpId,
        authProvider: 'email',
        emailVerified: false,
        },
    });

    // Assign department leads
    await prisma.department.update({
        where: { dpId: hrDept.dpId },
        data: { dpLead: admin.userId },
    });

    await prisma.department.update({
        where: { dpId: acDept.dpId },
        data: { dpLead: acUser.userId },
    });

    await prisma.department.update({
        where: { dpId: mkDept.dpId },
        data: { dpLead: mkUser.userId },
    });

    console.log('Seed completed successfully!');
    }

    main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
