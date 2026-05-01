const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userService = {
    async getAllUsers(filters = {}) {
        const { search, roleId, workspaceId, status } = filters;
        
        const where = {};
        if (search) {
            where.OR = [
                { userName: { contains: search, mode: 'insensitive' } },
                { userEmail: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (roleId) where.roleId = roleId;
        if (workspaceId) where.workspaceId = workspaceId;
        if (status) where.userStatus = status;
        
        return await prisma.user.findMany({
            where,
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                createdAt: true,
                role: { select: { roleName: true } },
                workspace: { select: { workspaceName: true } },
                department: { select: { dpName: true } }
            }
        });
    },
    
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                role: { select: { roleId: true, roleName: true } },
                workspace: { select: { workspaceId: true, workspaceName: true } },
                department: { select: { dpId: true, dpName: true } }
            }
        });
        
        if (!user) throw new Error('User not found');
        return user;
    },
    
    async updateUserProfile(userId, profileData) {
        const allowedFields = ['avatarUrl', 'city', 'country', 'timezone'];
        
        const updateData = {};
        allowedFields.forEach(field => {
            if (profileData[field] !== undefined) {
                updateData[field] = profileData[field];
            }
        });
        
        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update. Allowed: avatarUrl, city, country, timezone');
        }
        
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) throw new Error('User not found');
        
        return await prisma.user.update({
            where: { userId },
            data: updateData,
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                avatarUrl: true,
                city: true,
                country: true,
                timezone: true,
                createdAt: true,
                updatedAt: true,
                role: { select: { roleId: true, roleName: true } },
                department: { select: { dpId: true, dpName: true } }
            }
        });
    },
    
    async updateUserByAdmin(userId, updateData) {
        const { name, email, roleId, dpId, status, userPassword } = updateData;
        
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) throw new Error('User not found');

        const data = {
            userName: name,
            userEmail: email,
            roleId,
            dpId,
            userStatus: status
        };

        if (userPassword) {
            data.userPassword = await bcrypt.hash(userPassword, 10);
            data.emailVerified = true;
        }
        
        return await prisma.user.update({
            where: { userId },
            data,
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                avatarUrl: true,
                city: true,
                country: true,
                timezone: true,
                role: { select: { roleId: true, roleName: true } },
                department: { select: { dpId: true, dpName: true } }
            }
        });
    },
    
    async createUser(userData) {
        const { email, password, name, roleId, workspaceId, dpId } = userData;
        
        const existingUser = await prisma.user.findUnique({
            where: { userEmail: email }
        });
        
        if (existingUser) throw new Error('Email already exists');
        
        let hashedPassword;
        let plainTextPassword = null;
        
        if (password) {
            // admin provided a password
            hashedPassword = await bcrypt.hash(password, 10);
            plainTextPassword = password;
        } else {
            // generate temporary password
            plainTextPassword = crypto.randomBytes(6).toString('hex'); // 12 chars, e.g., "a3f5e7h9j2k4"
            hashedPassword = await bcrypt.hash(plainTextPassword, 10);
        }
        
        const user = await prisma.user.create({
            data: {
                userEmail: email,
                userPassword: hashedPassword,
                userName: name,
                roleId,
                workspaceId,
                dpId,
                authProvider: 'email',
                emailVerified: false,
                userStatus: 'offline'
            },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                createdAt: true
            }
        });
        
        // return the user + plain text password (for admin to share)
        return {
            ...user,
            temporaryPassword: plainTextPassword
        };
    },
    
    async changePassword(userId, oldPassword, newPassword) {
        // get user with password
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) throw new Error('User not found');
        if (!user.userPassword) throw new Error('No password set for this account');
        
        // verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.userPassword);
        if (!isPasswordValid) throw new Error('Current password is incorrect');
        
        // validate new password
        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }
        
        // hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // update user
        return await prisma.user.update({
            where: { userId },
            data: {
                userPassword: hashedNewPassword,
                emailVerified: true // mark email as verified after password change
            },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true
            }
        });
    },
    
    async deleteUser(userId) {
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) throw new Error('User not found');
        
        return await prisma.user.delete({ where: { userId } });
    },
    
    async getUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { userEmail: email }
        });
    }
};

module.exports = userService;
