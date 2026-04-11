const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // WORKSPACE
    const workspace = await prisma.workspace.upsert({
        where: { name: 'Default Workspace' },
        update: {},
        create: {
        name: 'Default Workspace',
        logoUrl: null,
        },
    });

    // ROLES
    const adminRole = await prisma.role.upsert({
        where: { roleName: 'Admin' },
        update: {},
        create: { roleName: 'Admin' },
    });

    // DEPARTMENTS
    const hrDept = await prisma.department.upsert({
        where: { dpName: 'Human Resources' },
        update: {},
        create: {
        dpName: 'Human Resources',
        workspaceId: workspace.workspaceId,
        },
    });

    // PASSWORD
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);

    // ADMIN USER
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
        workspaceId: workspace.workspaceId,
        dpId: hrDept.dpId,
        authProvider: 'email',
        emailVerified: true,
        },
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