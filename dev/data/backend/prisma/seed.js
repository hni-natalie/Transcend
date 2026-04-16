const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // WORKSPACE
    console.log('1. Checking workspace...');
    let workspace = await prisma.workspace.findFirst({
        where: { workspaceName: 'Default Workspace' }
    });

    if (!workspace) {
        console.log('   Creating workspace...');
        workspace = await prisma.workspace.create({
            data: { workspaceName: 'Default Workspace', logoUrl: null },
        });
        console.log('   Workspace created');
    } else {
        console.log('   ✅ Workspace already exists');
    }

    // ROLES
    console.log('2. Creating roles...');
    
    const adminRole = await prisma.role.upsert({
        where: { roleName: 'Admin' },
        update: {},
        create: { roleName: 'Admin' },
    });
    console.log('   ✅ Admin role ensured');

    const managerRole = await prisma.role.upsert({
        where: { roleName: 'Manager' },
        update: {},
        create: { roleName: 'Manager' },
    });
    console.log('   ✅ Manager role ensured');

    const teamleaderRole = await prisma.role.upsert({
        where: { roleName: 'Team Leader' },
        update: {},
        create: { roleName: 'Team Leader' },
    });
    console.log('   ✅ Team Leader role ensured');

    const teammemberRole = await prisma.role.upsert({
        where: { roleName: 'Team Member' },
        update: {},
        create: { roleName: 'Team Member' },
    });
    console.log('   ✅ Team Member role ensured');

    // DEPARTMENTS
    console.log('3. Creating departments...');
    const hrDept = await prisma.department.upsert({
        where: { dpName: 'Human Resources' },
        update: {},
        create: {
            dpName: 'Human Resources',
            workspaceId: workspace.workspaceId,
        },
    });
    console.log('   ✅ HR Department ensured');

    // PASSWORD
    console.log('4. Setting up admin password...');
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);
    console.log('   ✅ Password hashed');

    // ADMIN USER
    console.log('5. Creating admin user...');
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
    console.log('   ✅ Admin user ensured');

    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

