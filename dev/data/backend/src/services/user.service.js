const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getIO } = require('./socket.service');
const { validatePassword } = require('../utils/password');

const userService = {
    async getDashboardMetrics() {
        try {
            // pull the entire active user base with related department names
            const users = await prisma.user.findMany({
                select: {
                    userId: true,
                    userName: true,
                    userStatus: true,
                    department: {
                        select: { dpName: true }
                    },
					avatarUrl: true, 
                }
            });

            // format database objects cleanly for the frontend dashboard mapping
            return users.map(u => ({
                id: u.userId,
                name: u.userName,
                status: u.userStatus,
                department: u.department ? u.department.dpName : 'Unassigned',
				avatarUrl: u.avatarUrl || null 
            }));
        } catch (error) {
            console.error('Dashboard service data aggregation failed:', error);
            throw new Error('Failed to fetch dashboard metrics data layer');
        }
    },

	async getUserDashboardData(userId) {
		try {
			// Get current user with department
			const currentUser = await prisma.user.findUnique({
				where: { userId },
				select: {
					userId: true,
					userName: true,
					userEmail: true,
					userStatus: true,
					avatarUrl: true,
					country: true,
					timezone: true,
					department: {
						select: { dpName: true, dpId: true }
					},
					role: {
						select: { roleName: true }
					},
					lastLoginAt: true,
				}
			});

			if (!currentUser) {
				throw new Error('User not found');
			}
			
			// Get all users (for team presence)
			const allUsers = await prisma.user.findMany({
				select: {
					userId: true,
					userName: true,
					userEmail: true,
					userStatus: true,
					avatarUrl: true,
					country: true,
					timezone: true,
					department: {
						select: { dpName: true, dpId: true }
					},
					role: {
						select: { roleName: true }
					},
				}
			});
			
			// Get user's tasks
			const taskAssignments = await prisma.taskAssignment.findMany({
				where: { userId },
				include: {
					task: true
				}
			});
			
			// Format tasks
			const formattedTasks = taskAssignments.map(ta => ({
				taskId: ta.task.taskId,
				taskTitle: ta.task.taskTitle,
				taskDesc: ta.task.taskDesc,
				taskStatus: ta.task.taskStatus,
				dueDate: ta.task.dueDate,
				taskPriority: ta.taskPriority
			}));
			
			// Get user's meetings
			const meetingParticipants = await prisma.meetingParticipant.findMany({
				where: { userId },
				include: {
					meet: {
						include: { space: true }
					}
				},
				orderBy: {
					meet: { meetStart: 'asc' }
				}
			});
			
			// Format meetings
			const formattedMeetings = meetingParticipants.map(mp => ({
				meetId: mp.meet.meetId,
				meetTitle: mp.meet.meetTitle,
				meetDesc: mp.meet.meetDesc,
				meetStart: mp.meet.meetStart,
				meetEnd: mp.meet.meetEnd,
				spaceName: mp.meet.space?.spaceName,
				role: mp.role
			}));
			
			return {
				currentUser,
				allUsers,
				tasks: formattedTasks,
				meetings: formattedMeetings
			};
			
		} catch (error) {
			console.error('Dashboard service error:', error);
			throw error;
		}
	},

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
                avatarUrl: true,
				city: true,
				country: true,
				userTitle: true,
                roleId: true,
                role: { select: { roleId: true, roleName: true } },
                workspace: { select: { workspaceName: true } },
                department: { select: { dpId: true, dpName: true } }
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
				city: true,
				country: true,
				userTitle: true,
                role: { select: { roleId: true, roleName: true } },
                workspace: { select: { workspaceId: true, workspaceName: true } },
                department: { select: { dpId: true, dpName: true } }
            }
        });
        
        if (!user) throw new Error('User not found');
        return user;
    },
    
    async getUsersByStatus(userStatus) {
        const user = await prisma.user.findMany({
            where: {
                userStatus
            },
            select: {
                userId: true,
                userEmail: true,
                userName: true,
                userStatus: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                city: true,
                country: true,
                role: { select: { roleId: true, roleName: true } },
                workspace: { select: { workspaceId: true, workspaceName: true } },
                department: { select: { dpId: true, dpName: true } }
            }
        });
        if (!user) throw new Error('User not found');
        return user;
    },

    async updateUserProfile(userId, profileData) {
        const allowedFields = ['userName', 'userEmail', 'avatarUrl', 'city', 'country', 'timezone'];
        
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
        const { name, email, roleId, dpId, status, password, city, country, avatarUrl, userTitle } = updateData;
        
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) throw new Error('User not found');

        const data = {
            userName: name,
            userEmail: email,
            roleId,
            dpId,
            userStatus: status
        };

		if (userTitle !== undefined) data.userTitle = userTitle;
		if (city !== undefined) data.city = city;
    	if (country !== undefined) data.country = country;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (password) {
            const validation = validatePassword(password);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('. '));
            }
            data.userPassword = await bcrypt.hash(password, 10);
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
			const validation = validatePassword(password);
			if (!validation.isValid) {
			throw new Error(validation.errors.join('. '));
			}
            hashedPassword = await bcrypt.hash(password, 10);
            plainTextPassword = password;
        } else {
            // generate temporary password
            plainTextPassword = generateTemporaryPassword();
			hashedPassword = await bcrypt.hash(plainTextPassword, 10);
		}

		function generateTemporaryPassword() {
		const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const lowercase = 'abcdefghijklmnopqrstuvwxyz';
		const numbers = '0123456789';
		const specials = '!@#$%^&*()';
		
		const allChars = uppercase + lowercase + numbers + specials;
		let password = '';
		
		// Ensure at least one of each required type
		password += uppercase[Math.floor(Math.random() * uppercase.length)];
		password += lowercase[Math.floor(Math.random() * lowercase.length)];
		password += numbers[Math.floor(Math.random() * numbers.length)];
		password += specials[Math.floor(Math.random() * specials.length)];
		
		// Fill rest
		for (let i = 4; i < 12; i++) {
			password += allChars[Math.floor(Math.random() * allChars.length)];
		}
		
		// Shuffle
		return password.split('').sort(() => Math.random() - 0.5).join('');
		}
        
        const user = await prisma.user.create({
            data: {
                userEmail: email,
                userPassword: hashedPassword,
                userName: name,
                roleId,
                workspaceId,
                dpId,
				userTitle,
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
        const validation = validatePassword(newPassword);
		if (!validation.isValid) {
			throw new Error(validation.errors.join('. '));
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

	async resetUserPassword(userId, newPassword) {
		const user = await prisma.user.findUnique({
			where: { userId }
		});
		
		if (!user) throw new Error('User not found');
		
		// Validate new password
		const validation = validatePassword(newPassword);
		if (!validation.isValid) {
			throw new Error(validation.errors.join('. '));
		}
		
		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 10);
		
		// Update user
		return await prisma.user.update({
			where: { userId },
			data: {
				userPassword: hashedNewPassword,
				emailVerified: true
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
    },

	async updateUserStatus(userId, status) {
		const validStatuses = ['online', 'focus', 'in_meeting', 'away', 'offline'];
		if (!validStatuses.includes(status)) {
			throw new Error('Invalid status');
		}

		const currentUser = await prisma.user.findUnique({
			where: { userId },
			select: { userStatus: true }
		});
		
		if (currentUser?.userStatus === status) {
			return { userId, userStatus: status, unchanged: true };
		}


		await prisma.user.update({ where: { userId }, data: { userStatus: status } });
		  console.log('[user.service] broadcasting user-status-changed:', userId, status); // debug
		  getIO().emit('user-status-changed', { userId, status });
		return { userId, userStatus: status };
	}
};

module.exports = userService;
