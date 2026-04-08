const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Clean existing data (in reverse order of dependencies)
    console.log('Cleaning existing data...');
    await prisma.users.deleteMany();
    await prisma.Department.deleteMany();
    await prisma.roles.deleteMany();
    console.log('Cleanup complete.');

    // Create roles (using 'roles' model - lowercase)
    console.log('Creating roles...');
    const adminRole = await prisma.roles.create({ 
        data: { role_name: 'Admin' } 
    });

    const userRole = await prisma.roles.create({ 
        data: { role_name: 'User' } 
    });

    // Create departments (using 'Department' model - capital D)
    console.log('Creating departments...');
    const hrDept = await prisma.Department.create({ 
        data: { 
            dpName: 'Human Resources'  // matches @map("dp_name")
        } 
    });
    
    const acDept = await prisma.Department.create({ 
        data: { 
            dpName: 'Accounts' 
        } 
    });
    
    const mkDept = await prisma.Department.create({ 
        data: { 
            dpName: 'Marketing' 
        } 
    });

    // Create users (using 'users' model - lowercase)
    console.log('Creating admin user...');
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.users.create({
        data: {
            user_email: 'superuser@workfrom.com',
            user_password: adminHash,
            user_name: 'Administrator',
            user_status: 'online',
            role_id: adminRole.role_id,      // references roles.role_id
            dp_id: hrDept.dpId,              // references Department.dpId (maps to dp_id)
            auth_provider: 'email',
            email_verified: true,
        }
    });

    console.log('Creating accounts user...');
    const acPassword = fs.readFileSync('/run/secrets/app_user', 'utf8').trim();
    const acHash = await bcrypt.hash(acPassword, 10);
    const acUser = await prisma.users.create({
        data: {
            user_email: 'user1@workfrom.com',
            user_password: acHash,
            user_name: 'John Doe',
            user_status: 'offline',
            role_id: userRole.role_id,
            dp_id: acDept.dpId,
            auth_provider: 'email',
            email_verified: true,
        }
    });

    console.log('Creating marketing user...');
    const mkPassword = fs.readFileSync('/run/secrets/app_user', 'utf8').trim();
    const mkHash = await bcrypt.hash(mkPassword, 10);
    const mkUser = await prisma.users.create({
        data: {
            user_email: 'user2@workfrom.com',
            user_password: mkHash,
            user_name: 'Mary Jane',
            user_status: 'busy',
            role_id: userRole.role_id,
            dp_id: mkDept.dpId,
            auth_provider: 'email',
            email_verified: false,
        }
    });

    // Update department leads (using dpLead field - maps to dp_lead)
    console.log('Updating department leads...');
    await prisma.Department.update({
        where: { dpId: hrDept.dpId },
        data: { dpLead: admin.user_id }      // dpLead maps to dp_lead column
    });
    
    await prisma.Department.update({
        where: { dpId: acDept.dpId },
        data: { dpLead: acUser.user_id }
    });
    
    await prisma.Department.update({
        where: { dpId: mkDept.dpId },
        data: { dpLead: mkUser.user_id }
    });

    console.log('Seed completed!');
    console.log(`Created:
        - Admin: ${admin.user_email} (Role: Admin, Dept: Human Resources)
        - Accounts User: ${acUser.user_email} (Role: User, Dept: Accounts)
        - Marketing User: ${mkUser.user_email} (Role: User, Dept: Marketing)
    `);
}

main()
    .catch((e) => {
        console.error('Error during seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });