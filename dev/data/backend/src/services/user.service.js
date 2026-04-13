const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class UserService {
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
                role: {
                    select: { roleName: true }
                },
                workspace: {
                    select: { name: true }
                },
                department: {
                    select: { dpName: true }
                }
            }
        });
    }
    
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                userPassword: false, // Exclude password
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                role: {
                    select: { roleId: true, roleName: true }
                },
                workspace: {
                    select: { workspaceId: true, name: true }
                },
                department: {
                    select: { dpId: true, dpName: true }
                }
            }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    }
    
    async createUser(userData) {
        const { email, password, name, roleId, workspaceId, dpId } = userData;
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { userEmail: email }
        });
        
        if (existingUser) {
            throw new Error('Email already exists');
        }
        
        // Generate temp password if not provided
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        } else {
            const tempPassword = crypto.randomBytes(8).toString('hex');
            hashedPassword = await bcrypt.hash(tempPassword, 10);
            // TODO: Send temp password via email
        }
        
        return await prisma.user.create({
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
    }
    
    async updateUser(userId, updateData) {
        const { name, roleId, dpId, status } = updateData;
        
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return await prisma.user.update({
            where: { userId },
            data: {
                userName: name,
                roleId,
                dpId,
                userStatus: status
            },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true
            }
        });
    }
    
    async deleteUser(userId) {
        const user = await prisma.user.findUnique({
            where: { userId }
        });
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return await prisma.user.delete({
            where: { userId }
        });
    }
    
    async getUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { userEmail: email }
        });
    }
}

module.exports = new UserService();