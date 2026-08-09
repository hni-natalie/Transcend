const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper function to generate title based on role and department
function generateTitle(roleName, departmentName) {
    const deptMap = {
        'Human Resources': 'HR',
        'Accounts': 'Finance',
        'Operations': 'Operations',
        'Marketing': 'Marketing',
        'Engineering': 'Engineering',
        'Design': 'Design'
    };

    const shortDept = deptMap[departmentName] || departmentName;

    switch (roleName) {
        case 'Admin':
            return 'System Administrator';
        case 'Manager':
            return `Head of ${departmentName}`;
        case 'Team Leader':
            return `Senior ${shortDept} Lead`;
        case 'Team Member':
            const titles = {
                'Human Resources': 'HR Executive',
                'Accounts': 'Finance Executive',
                'Operations': 'Operations Executive',
                'Marketing': 'Marketing Executive',
                'Engineering': 'Software Engineer',
                'Design': 'Product Designer'
            };
            return titles[departmentName] || `${shortDept} Executive`;
        default:
            return 'Team Member';
    }
}

async function main() {
    console.log('Starting seed...');

    // 1. WORKSPACE
    let workspace = await prisma.workspace.findFirst({
        where: { workspaceName: 'Default Workspace' }
    });

    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: { workspaceName: 'Default Workspace', logoUrl: null },
        });
    }
    const wsId = workspace.workspaceId;

    // 2. ROLES
    const roles = {
        admin: await prisma.role.upsert({ where: { roleName: 'Admin' }, update: {}, create: { roleName: 'Admin' } }),
        manager: await prisma.role.upsert({ where: { roleName: 'Manager' }, update: {}, create: { roleName: 'Manager' } }),
        leader: await prisma.role.upsert({ where: { roleName: 'Team Leader' }, update: {}, create: { roleName: 'Team Leader' } }),
        member: await prisma.role.upsert({ where: { roleName: 'Team Member' }, update: {}, create: { roleName: 'Team Member' } })
    };

    // 3. DEPARTMENTS
    const depts = {
        hr: await prisma.department.upsert({ where: { dpName: 'Human Resources' }, update: {}, create: { dpName: 'Human Resources', workspaceId: wsId } }),
        accounts: await prisma.department.upsert({ where: { dpName: 'Accounts' }, update: {}, create: { dpName: 'Accounts', workspaceId: wsId } }),
        ops: await prisma.department.upsert({ where: { dpName: 'Operations' }, update: {}, create: { dpName: 'Operations', workspaceId: wsId } }),
        marketing: await prisma.department.upsert({ where: { dpName: 'Marketing' }, update: {}, create: { dpName: 'Marketing', workspaceId: wsId } }),
        engineering: await prisma.department.upsert({ where: { dpName: 'Engineering' }, update: {}, create: { dpName: 'Engineering', workspaceId: wsId } }),
        design: await prisma.department.upsert({ where: { dpName: 'Design' }, update: {}, create: { dpName: 'Design', workspaceId: wsId } })
    };

    // 4. SPACES
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

    // 5. PASSWORD ENCRYPTION
    const adminPassword = fs.readFileSync('/run/secrets/app_root', 'utf8').trim();
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const mockPassword = fs.readFileSync('/run/secrets/app_mock', 'utf8').trim();
    const mockUserHash = await bcrypt.hash(mockPassword, 10);

    // 6. SYSTEM ADMINISTRATOR
    await prisma.user.upsert({
        where: { userEmail: 'superuser@workfrom.com' },
        update: { 
            userPassword: adminHash, 
            userStatus: 'online',
            userTitle: 'System Administrator'
        },
        create: {
            userEmail: 'superuser@workfrom.com',
            userPassword: adminHash,
            userName: 'Administrator',
            userTitle: 'System Administrator',
            userStatus: 'online',
            roleId: roles.admin.roleId,
            workspaceId: wsId,
            dpId: depts.hr.dpId,
            authProvider: 'email',
            emailVerified: true,
        },
    });

    // 7. GOOGLE AUTH USERS
    const googleUsers = [
        { email: 'holickka@gmail.com', name: 'Hoi Ling', status: 'online' },
        { email: 'natalieho061@gmail.com', name: 'Natalie Ho', status: 'online' },
        { email: 'joophang1023@gmail.com', name: 'Yee Joo', status: 'online' },
        { email: 'theoffgrid@gmail.com', name: 'Lyara Azhar', status: 'online' }
    ];

    for (const gu of googleUsers) {
        await prisma.user.upsert({
            where: { userEmail: gu.email },
            update: { 
                userName: gu.name, 
                userStatus: gu.status, 
                dpId: depts.hr.dpId, 
                roleId: roles.member.roleId,
                userTitle: 'HR Executive'
            },
            create: {
                userEmail: gu.email,
                userName: gu.name,
                userTitle: 'HR Executive',
                userStatus: gu.status,
                roleId: roles.member.roleId,
                workspaceId: wsId,
                dpId: depts.hr.dpId,
                authProvider: 'google',
                emailVerified: true
            }
        });
    }

    // 8. GENERATING DEPARTMENT MOCK USERS WITH TITLES
    const departmentNames = {
        [depts.accounts.dpId]: 'Accounts',
        [depts.marketing.dpId]: 'Marketing',
        [depts.ops.dpId]: 'Operations',
        [depts.engineering.dpId]: 'Engineering',
        [depts.design.dpId]: 'Design'
    };

    const operationalStaffMatrix = [
        // ACCOUNTS
        { email: 'accounts.mgr@workfrom.com', name: 'Sarah Jenkins', dept: depts.accounts.dpId, role: roles.manager.roleId, status: 'online' },
        { email: 'accounts.lead@workfrom.com', name: 'David Miller', dept: depts.accounts.dpId, role: roles.leader.roleId, status: 'online' },
        { email: 'accounts.staff1@workfrom.com', name: 'Emily Warren', dept: depts.accounts.dpId, role: roles.member.roleId, status: 'in_meeting' },

        // MARKETING
        { email: 'marketing.mgr@workfrom.com', name: 'Olivia Martinez', dept: depts.marketing.dpId, role: roles.manager.roleId, status: 'online' },
        { email: 'marketing.lead@workfrom.com', name: 'Lucas Davies', dept: depts.marketing.dpId, role: roles.leader.roleId, status: 'focus' },
        { email: 'marketing.staff1@workfrom.com', name: 'Chloe Fraser', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline' },
        { email: 'marketing.staff2@workfrom.com', name: 'Ethan Burke', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline' },
        { email: 'marketing.staff3@workfrom.com', name: 'Amara Okafor', dept: depts.marketing.dpId, role: roles.member.roleId, status: 'offline' },

        // OPERATIONS
        { email: 'ops.mgr@workfrom.com', name: 'Marcus Brody', dept: depts.ops.dpId, role: roles.manager.roleId, status: 'in_meeting' },
        { email: 'ops.lead@workfrom.com', name: 'Nina Vance', dept: depts.ops.dpId, role: roles.leader.roleId, status: 'in_meeting' },
        { email: 'ops.staff1@workfrom.com', name: 'Nathan Cole', dept: depts.ops.dpId, role: roles.member.roleId, status: 'offline' },
        { email: 'ops.staff2@workfrom.com', name: 'Hana Kimura', dept: depts.ops.dpId, role: roles.member.roleId, status: 'offline' },

        // ENGINEERING
        { email: 'eng.mgr@workfrom.com', name: 'Devon Lane', dept: depts.engineering.dpId, role: roles.manager.roleId, status: 'online' },
        { email: 'eng.lead@workfrom.com', name: 'James Smith', dept: depts.engineering.dpId, role: roles.leader.roleId, status: 'online' },
        { email: 'eng.staff1@workfrom.com', name: 'Owen Carter', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'focus' },
        { email: 'eng.staff2@workfrom.com', name: 'Zara Ahmed', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'focus' },
        { email: 'eng.staff3@workfrom.com', name: 'Clara Bennett', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'eng.staff4@workfrom.com', name: 'Tariq Johnson', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'eng.staff5@workfrom.com', name: 'Arjun Mehta', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'eng.staff6@workfrom.com', name: 'Elena Petrova', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'eng.staff7@workfrom.com', name: 'Marcus Reed', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'eng.staff8@workfrom.com', name: 'Yuki Tanaka', dept: depts.engineering.dpId, role: roles.member.roleId, status: 'online' },

        // DESIGN
        { email: 'design.mgr@workfrom.com', name: 'Sophia Grant', dept: depts.design.dpId, role: roles.manager.roleId, status: 'focus' },
        { email: 'design.lead@workfrom.com', name: 'Clarke Mason', dept: depts.design.dpId, role: roles.leader.roleId, status: 'focus' },
        { email: 'design.staff1@workfrom.com', name: 'Aisha Rahman', dept: depts.design.dpId, role: roles.member.roleId, status: 'online' },
        { email: 'design.staff2@workfrom.com', name: 'Liam Parker', dept: depts.design.dpId, role: roles.member.roleId, status: 'online' }
    ];

    // Department name mapping for title generation
    const deptNameMap = {
        [depts.accounts.dpId]: 'Accounts',
        [depts.marketing.dpId]: 'Marketing',
        [depts.ops.dpId]: 'Operations',
        [depts.engineering.dpId]: 'Engineering',
        [depts.design.dpId]: 'Design',
        [depts.hr.dpId]: 'Human Resources'
    };

    // Role name mapping
    const roleNameMap = {
        [roles.manager.roleId]: 'Manager',
        [roles.leader.roleId]: 'Team Leader',
        [roles.member.roleId]: 'Team Member',
        [roles.admin.roleId]: 'Admin'
    };

    for (const u of operationalStaffMatrix) {
        const deptName = deptNameMap[u.dept];
        const roleName = roleNameMap[u.role];
        const title = generateTitle(roleName, deptName);

        await prisma.user.upsert({
            where: { userEmail: u.email },
            update: { 
                userName: u.name, 
                userStatus: u.status, 
                dpId: u.dept, 
                roleId: u.role,
                userTitle: title
            },
            create: {
                userEmail: u.email,
                userPassword: mockUserHash,
                userName: u.name,
                userTitle: title,
                userStatus: u.status,
                roleId: u.role,
                workspaceId: wsId,
                dpId: u.dept,
                authProvider: 'email',
                emailVerified: true
            }
        });
    }
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });