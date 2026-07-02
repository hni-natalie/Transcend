const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. WORKSPACE
    // console.log('1. Checking workspace...');
    let workspace = await prisma.workspace.findFirst({
        where: { workspaceName: 'Default Workspace' }
    });

    if (!workspace) {
        // console.log('   Creating default workspace...');
        workspace = await prisma.workspace.create({
            data: { workspaceName: 'Default Workspace', logoUrl: null },
        });
    }
    const wsId = workspace.workspaceId;
    // console.log('   ✅ Workspace boundary locked');

    // 2. ROLES
    // console.log('2. Syncing system user roles...');
    const roles = {
        admin: await prisma.role.upsert({ where: { roleName: 'Admin' }, update: {}, create: { roleName: 'Admin' } }),
        manager: await prisma.role.upsert({ where: { roleName: 'Manager' }, update: {}, create: { roleName: 'Manager' } }),
        leader: await prisma.role.upsert({ where: { roleName: 'Team Leader' }, update: {}, create: { roleName: 'Team Leader' } }),
        member: await prisma.role.upsert({ where: { roleName: 'Team Member' }, update: {}, create: { roleName: 'Team Member' } })
    };
    // console.log('   ✅ System user roles up to date');

    // 3. DEPARTMENTS
    // console.log('3. Injecting office departments...');
    const depts = {
        hr: await prisma.department.upsert({ where: { dpName: 'Human Resources' }, update: {}, create: { dpName: 'Human Resources', workspaceId: wsId } }),
        accounts: await prisma.department.upsert({ where: { dpName: 'Accounts' }, update: {}, create: { dpName: 'Accounts', workspaceId: wsId } }),
        ops: await prisma.department.upsert({ where: { dpName: 'Operations' }, update: {}, create: { dpName: 'Operations', workspaceId: wsId } }),
        marketing: await prisma.department.upsert({ where: { dpName: 'Marketing' }, update: {}, create: { dpName: 'Marketing', workspaceId: wsId } }),
        engineering: await prisma.department.upsert({ where: { dpName: 'Engineering' }, update: {}, create: { dpName: 'Engineering', workspaceId: wsId } }),
        design: await prisma.department.upsert({ where: { dpName: 'Design' }, update: {}, create: { dpName: 'Design', workspaceId: wsId } })
    };
    // console.log('   ✅ All 6 departments ensured');

    // 4. SPACES (Seating capacities bound strictly to matching department sizes)
    // console.log('4. Mounting virtual spaces with department-locked capacities...');
    const spacesList = [
        { name: 'The Town Hall', access: 'shared', deptId: null, capacity: 100 },
        { name: 'Meeting Room S', access: 'shared', deptId: null, capacity: 4 },
        { name: 'Meeting Room M', access: 'shared', deptId: null, capacity: 12 },
        { name: 'Meeting Room L', access: 'shared', deptId: null, capacity: 30 },
        
        { name: 'People Ops Hub', access: 'department', deptId: depts.hr.dpId, capacity: 4 },        
        { name: 'Audit Vault', access: 'department', deptId: depts.accounts.dpId, capacity: 3 },     
        { name: 'Logistics Ops Hub', access: 'department', deptId: depts.ops.dpId, capacity: 4 },     
        { name: 'Growth Lab', access: 'department', deptId: depts.marketing.dpId, capacity: 5 },     
        { name: 'Dev Lab', access: 'department', deptId: depts.engineering.dpId, capacity: 10 },    
        { name: 'Creative Lab', access: 'department', deptId: depts.design.dpId, capacity: 4 }       
    ];

    const spaces = {};
    for (const s of spacesList) {
        let existingSpace = await prisma.space.findFirst({ where: { spaceName: s.name, workspaceId: wsId } });
        if (!existingSpace) {
            spaces[s.name] = await prisma.space.create({
                data: {
                    spaceName: s.name,
                    workspaceId: wsId,
                    accessLevel: s.access === 'shared' ? 'shared' : 'department',
                    departmentId: s.deptId,
                    userCapacity: s.capacity
                }
            });
        } else {
            spaces[s.name] = await prisma.space.update({
                where: { spaceId: existingSpace.spaceId },
                data: {
                    accessLevel: s.access === 'shared' ? 'shared' : 'department',
                    departmentId: s.deptId,
                    userCapacity: s.capacity
                }
            });
        }
    }
    // console.log('   ✅ All room capacities up to date');

    // 5. PASSWORD ENCRYPTION BASE FOR STANDARD ACCOUNTS
    // console.log('5. Setting up admin & mock passwords...');
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);
	const mockPassword = fs.readFileSync('/run/secrets/app_mock', 'utf8').trim();
    const mockUserHash = await bcrypt.hash(mockPassword, 10); 
    // console.log('   ✅ Passwords ready');

    // 6. SYSTEM ADMINISTRATOR
    // console.log('6. Ensuring system administrator...');
    await prisma.user.upsert({
        where: { userEmail: 'superuser@workfrom.com' },
        update: { userPassword: adminHash, userStatus: 'online' },
        create: {
            userEmail: 'superuser@workfrom.com',
            userPassword: adminHash,
            userName: 'Administrator',
            userStatus: 'online',
            roleId: roles.admin.roleId,
            workspaceId: wsId,
            dpId: depts.hr.dpId,
            authProvider: 'email',
            emailVerified: true,
        },
    });
    // console.log('   ✅ Admin account locked');

    // 7. GOOGLE AUTH USERS (All in People Ops Hub)
    // console.log('7. Syncing HR core Google Auth team members into People Ops Hub...');
    const googleUsers = [
		{ email: 'holickka@gmail.com', name: 'Hoi Ling', status: 'online' },         
        { email: 'natalieho061@gmail.com', name: 'Natalie Ho', status: 'online' },    
        { email: 'joophang1023@gmail.com', name: 'Yee Joo', status: 'online' },        
        { email: 'theoffgrid@gmail.com', name: 'Lyara Azhar', status: 'online' }      
    ];

    for (const gu of googleUsers) {
        await prisma.user.upsert({
            where: { userEmail: gu.email },
            update: { userName: gu.name, userStatus: gu.status, dpId: depts.hr.dpId, roleId: roles.member.roleId },
            create: {
                userEmail: gu.email,
                userName: gu.name,
                userStatus: gu.status,
                roleId: roles.member.roleId,
                workspaceId: wsId,
                dpId: depts.hr.dpId,
                authProvider: 'google',
                emailVerified: true
            }
        });
    }

    // 8. GENERATING THE 26 DEPARTMENT MOCK USERS WITH METRIC TALLY
    // console.log('8. Distributing corporate staff into respective department configurations...');
    
    const operationalStaffMatrix = [
        // ACCOUNTS
        { email: 'accounts.mgr@workfrom.com', name: 'Sarah Jenkins', dept: depts.accounts.dpId, role: roles.manager.roleId, status: 'online', room: 'Audit Vault' },     
        { email: 'accounts.lead@workfrom.com', name: 'David Miller', dept: depts.accounts.dpId, role: roles.leader.roleId, status: 'online', room: 'Audit Vault' },     
        { email: 'accounts.staff1@workfrom.com', name: 'Emily Warren', dept: depts.accounts.dpId, role: roles.member.roleId, status: 'in_meeting', room: 'Meeting Room S' }, 

        // MARKETING
        { email: 'marketing.mgr@workfrom.com', name: 'Olivia Martinez', dept: depts.marketing.dpId, role: roles.manager.roleId, status: 'online', room: 'Growth Lab' }, 
        { email: 'marketing.lead@workfrom.com', name: 'Lucas Davies', dept: depts.marketing.dpId, role: roles.leader.roleId, status: 'focus', room: 'Growth Lab' },       
        { email: 'marketing.staff1@workfrom.com', name: 'Chloe Fraser', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline', room: null }, 
        { email: 'marketing.staff2@workfrom.com', name: 'Ethan Burke', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline', room: null },
        { email: 'marketing.staff3@workfrom.com', name: 'Amara Okafor', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline', room: null },

        // OPERATIONS
        { email: 'ops.mgr@workfrom.com', name: 'Marcus Brody', dept: depts.ops.dpId, role: roles.manager.roleId, status: 'in_meeting', room: 'Meeting Room S' },     
        { email: 'ops.lead@workfrom.com', name: 'Nina Vance', dept: depts.ops.dpId, role: roles.leader.roleId, status: 'in_meeting', room: 'Meeting Room S' },       
        { email: 'ops.staff1@workfrom.com', name: 'Nathan Cole', dept: depts.ops.dpId, role: roles.member.roleId, status: 'offline', room: null },
        { email: 'ops.staff2@workfrom.com', name: 'Hana Kimura', dept: depts.ops.dpId, role: roles.member.roleId, status: 'offline', room: null },

        // ENGINEERING
        { email: 'eng.mgr@workfrom.com', name: 'Devon Lane', dept: depts.engineering.dpId, role: roles.manager.roleId, status: 'online', room: 'Dev Lab' },       
        { email: 'eng.lead@workfrom.com', name: 'James Smith', dept: depts.engineering.dpId, role: roles.leader.roleId, status: 'online', room: 'Dev Lab' },       
        { email: 'eng.staff1@workfrom.com', name: 'Owen Carter', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'focus', room: 'Dev Lab' },    
        { email: 'eng.staff2@workfrom.com', name: 'Zara Ahmed', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'focus', room: 'Dev Lab' },        
        { email: 'eng.staff3@workfrom.com', name: 'Clara Bennett', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },     
        { email: 'eng.staff4@workfrom.com', name: 'Tariq Johnson', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },    
        { email: 'eng.staff5@workfrom.com', name: 'Arjun Mehta', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },       
        { email: 'eng.staff6@workfrom.com', name: 'Elena Petrova', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },     
        { email: 'eng.staff7@workfrom.com', name: 'Marcus Reed', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },       
        { email: 'eng.staff8@workfrom.com', name: 'Yuki Tanaka', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online', room: 'Dev Lab' },       

        // DESIGN
        { email: 'design.mgr@workfrom.com', name: 'Sophia Grant', dept: depts.design.dpId, role: roles.manager.roleId, status: 'focus', room: 'Creative Lab' },         
        { email: 'design.lead@workfrom.com', name: 'Clarke Mason', dept: depts.design.dpId, role: roles.leader.roleId, status: 'focus', room: 'Creative Lab' },         
        { email: 'design.staff1@workfrom.com', name: 'Aisha Rahman', dept: depts.design.dpId, role: roles.member.roleId, status: 'online', room: 'Creative Lab' },     
        { email: 'design.staff2@workfrom.com', name: 'Liam Parker', dept: depts.design.dpId, role: roles.member.roleId, status: 'online', room: 'Creative Lab' }       
    ];

    for (const u of operationalStaffMatrix) {
        await prisma.user.upsert({
            where: { userEmail: u.email },
            update: { userName: u.name, userStatus: u.status, dpId: u.dept, roleId: u.role },
            create: {
                userEmail: u.email,
                userPassword: mockUserHash,
                userName: u.name,
                userStatus: u.status,
                roleId: u.role,
                workspaceId: wsId,
                dpId: u.dept,
                authProvider: 'email',
                emailVerified: true
            }
        });
    }
    // console.log('   ✅ Roster balanced perfectly: 17 Available, 5 focus, 3 In Meeting.');
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
