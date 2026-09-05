const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getIO, forceLogoutUser } = require('./socket.service');
const { uploadFile, deleteFile } = require('./supabase.service');
const { validatePassword } = require('../utils/password');
const { VALID_STATUSES } = require('../validators/user.validator');
const { sendDataExportEmail, sendAccountDeletionRequestEmail, notifySupportOfDeletionRequest } = require('../utils/mailer');

// only google users receive email, mock users with fake email dont (for demo only)
const canReceiveRealEmail = (user) => user.authProvider === 'google';

function buildAvatarPath(userId, originalName) {
    const fileExt = originalName.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    return `avatars/${userId}/${fileName}`;
}

// avatarUrl only stores the public URL, not the storage path — parse it back out.
// Returns null if the URL isn't Supabase-hosted (e.g. an un-synced raw Google photo URL).
function extractSupabaseStoragePath(publicUrl) {
    if (!publicUrl) return null;

    const marker = '/storage/v1/object/public/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;

    const [bucket, ...pathParts] = publicUrl.slice(idx + marker.length).split('/');
    const filePath = pathParts.join('/');
    return bucket && filePath ? { bucket, filePath } : null;
}

const userService = {
    async getDashboardMetrics() {
        try {
            // pull the entire active user base with related department names
            const users = await prisma.user.findMany({
				where: { deletedAt: null },
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
				where: { deletedAt: null },
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
        
        const where = { deletedAt: null };
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
				deletedAt: true,
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
        
        if (!user || user.deletedAt) throw new Error('User not found');
        return user;
    },
    
    async getUsersByStatus(userStatus) {
        const users = await prisma.user.findMany({
            where: { userStatus, deletedAt: null },
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
        return users;
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
            throw new Error('No valid fields to update. Allowed: name, email, avatar, city, country, timezone');
        }
        
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user) throw new Error('User not found');

		if (updateData.userEmail) {
            const existingUser = await prisma.user.findUnique({
                where: { userEmail: updateData.userEmail }
            });
            if (existingUser && existingUser.userId !== userId) {
                throw new Error('Email already in use by another account');
            }
        }
        
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

    async uploadAvatar(userId, file, bucket) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        const filePath = buildAvatarPath(userId, file.originalname);
        const publicUrl = await uploadFile(bucket, filePath, file.buffer, file.mimetype);

        const user = await prisma.user.update({
            where: { userId },
            data: { avatarUrl: publicUrl },
            select: {
                userId: true,
                userName: true,
                avatarUrl: true,
            }
        });

        return { avatarUrl: publicUrl, user };
    },
    
    async createUser(userData) {
        const { email, password, name, roleId, workspaceId, dpId, userTitle } = userData;
        
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
    	const user = await prisma.user.findUnique({
       		where: { userId }
    	});

		if (!user) throw new Error('User not found');
		if (!user.userPassword) throw new Error('No password set for this account');

		const isPasswordValid = await bcrypt.compare(oldPassword, user.userPassword);
		if (!isPasswordValid) throw new Error('Current password is incorrect');

		const validation = validatePassword(newPassword);
		if (!validation.isValid) {
			throw new Error(validation.errors.join('. '));
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { userId },
			data: {
				userPassword: hashedNewPassword,
			},
			select: { userId: true }
		});
	},

	async resetUserPassword(userId, newPassword) {
		const user = await prisma.user.findUnique({
			where: { userId }
		});

		if (!user) throw new Error('User not found');

		const validation = validatePassword(newPassword);
		if (!validation.isValid) {
			throw new Error(validation.errors.join('. '));
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { userId },
			data: {
				userPassword: hashedNewPassword,
			},
			select: { userId: true }
		});
	},

	async deleteUser(userId) {
		const user = await prisma.user.findUnique({ where: { userId } });
		if (!user) throw new Error('User not found');

		if (user.deletedAt) {
			return { alreadyErased: true, erasedAt: user.deletedAt };
		}

		const placeholderEmail = `deleted-${userId}@erased.local`;

		const erasedUser = await prisma.user.update({
			where: { userId },
			data: {
				deletedAt: new Date(),
				userEmail: placeholderEmail,
				userName: 'Deleted User',
				userPassword: null,
				googleId: null,
				avatarUrl: null,
				avatarSyncedAt: null,
				userStatus: 'offline',
				city: null,
				country: null,
				timezone: null,
				socketId: null,
			},
			select: { userId: true, deletedAt: true },
		});

		// Side effects are best-effort
		// a storage or socket hiccup shouldn't block the erasure itself, since the DB scrub already succeeded.
		const avatarLocation = extractSupabaseStoragePath(user.avatarUrl);
		if (avatarLocation) {
			deleteFile(avatarLocation.bucket, avatarLocation.filePath).catch((err) =>
				console.error('[user.service] Failed to delete avatar file during erasure:', err)
			);
		}

		try {
			forceLogoutUser(userId);
		} catch (err) {
			console.error('[user.service] Failed to force-disconnect erased user:', err);
		}

		return { alreadyErased: false, erasedAt: erasedUser.deletedAt };
	},
    
    // async deleteUser(userId) {
    //     const user = await prisma.user.findUnique({ where: { userId } });
    //     if (!user) throw new Error('User not found');
        
    //     return await prisma.user.delete({ where: { userId } });
    // },
    
	async updateUserStatus(userId, status) {
		if (!VALID_STATUSES.includes(status)) {
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
	},

	// instant download and audit trail
	async exportUserData(userId) {
		const user = await prisma.user.findUnique({
			where: { userId },
			select: {
				userId: true,
				userEmail: true,
				userName: true,
				userTitle: true,
				avatarUrl: true,
				city: true,
				country: true,
				timezone: true,
				authProvider: true,
				userStatus: true,
				lastLoginAt: true,
				createdAt: true,
				updatedAt: true,
				role: { select: { roleName: true } },
				department: { select: { dpName: true } },
			}
		});

		if (!user) throw new Error('User not found');

		const [activityLogs, createdTasks, assignedTasks, createdMeetings, meetingParticipations, messages] = await Promise.all([
			prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
			prisma.task.findMany({ where: { createdByUserId: userId } }),
			prisma.taskAssignment.findMany({ where: { userId }, include: { task: { select: { taskTitle: true, taskStatus: true } } } }),
			prisma.meeting.findMany({ where: { createdByUserId: userId } }),
			prisma.meetingParticipant.findMany({ where: { userId }, include: { meet: { select: { meetTitle: true, meetStart: true, meetEnd: true } } } }),
			prisma.message.findMany({
				where: { authorId: userId, deletedAt: null },
				select: { messageId: true, conversationId: true, text: true, createdAt: true, attachments: { select: { name: true, kind: true, url: true } } }
			}),
		]);

		const requestedAt = new Date();

		await prisma.user.update({
			where: { userId },
			data: { dataExportRequestedAt: requestedAt, dataExportCompletedAt: requestedAt },

		});

		const payload = {
			profile: user,
			workspaceActivity: {
				statusAndActivityLogs: activityLogs,
			},
			collaborativeContent: {
				meetingsCreated: createdMeetings,
				meetingsParticipated: meetingParticipations,
				tasksCreated: createdTasks,
				tasksAssigned: assignedTasks,
				sentMessages: messages,
			},
			generatedAt: requestedAt,
		};

		if (canReceiveRealEmail(user)) {
			sendDataExportEmail({
				to: user.userEmail,
				userName: user.userName,
				requestedAt,
				completedAt: requestedAt,
			}).catch((err) => console.error('[user.service] Failed to send data export email:', err));
		} else {
			console.log(`[user.service] Skipping data export email for mock user ${user.userEmail} (authProvider=${user.authProvider})`);
		}

		return {
			requestedAt,
			completedAt: requestedAt,
			data: payload,
		};
	},

	// request only, notify user and support (admin)
	async requestAccountDeletion(userId) {
		const user = await prisma.user.findUnique({ where: { userId } });
		if (!user) throw new Error('User not found');

		if (user.deletionRequestedAt) {
			return { alreadyRequested: true, requestedAt: user.deletionRequestedAt };
		}
		
		const requestedAt = new Date();

		await prisma.user.update({
			where: { userId },
			data: { deletionRequestedAt: requestedAt },

		});

		const emailTasks = [
			notifySupportOfDeletionRequest({
				userId: user.userId,
				userEmail: user.userEmail,
				userName: user.userName,
				requestedAt,
			}),
		];

		if (canReceiveRealEmail(user)) {
			emailTasks.push(
				sendAccountDeletionRequestEmail({
					to: user.userEmail,
					userName: user.userName,
					requestedAt,
				})
			);
		} else {
			console.log(`[user.service] Skipping deletion confirmation email for mock user ${user.userEmail} (authProvider=${user.authProvider})`);
		}

		await Promise.all(emailTasks).catch((err) =>
			console.error('[user.service] Failed to send deletion request emails:', err)
		);

		return { alreadyRequested: false, requestedAt };
		}
};

module.exports = userService;
