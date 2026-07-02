const prisma = require('../../prisma/client');
const userService = require('../services/user.service');
const { validatePassword, PASSWORD_RULES } = require('../utils/password');

const userController = {
	async getDashboardMetrics(req, res) {
        try {
            const metrics = await userService.getDashboardMetrics();
            return res.json({ users: metrics });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

	async getUserDashboard(req, res) {
		try {
			const userId = req.user.userId;
			const dashboardData = await userService.getUserDashboardData(userId);
			return res.json(dashboardData);
		} catch (error) {
			console.error('Dashboard controller error:', error);
			if (error.message === 'User not found') {
				return res.status(404).json({ error: error.message });
			}
			return res.status(500).json({ error: error.message });
		}
	},

    async getCurrentUser(req, res) {
        try {
            const user = await userService.getUserById(req.user.userId);
            return res.json(user);
        } catch (error) {
            if (error.message === 'User Not Found')
                return res.status(404).json({ error: error.message });
            else
                return res.status(500).json({ error: error.message });
        }
    },

    async updateCurrentUser(req, res) {
        try {
            const allowedUpdates = ['userName', 'userEmail', 'city', 'country', 'timezone'];
            const updates = {};
            
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });
            
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ 
                    error: 'No valid fields to update. Allowed: name, email, city, country, timezone' 
                });
            }

			if (updates.userEmail) {
            const existingUser = await userService.getUserByEmail(updates.userEmail);
            if (existingUser && existingUser.userId !== req.user.userId) {
                return res.status(409).json({ 
                    error: 'Email already in use by another account' 
                });
            }
        }
            
            const user = await userService.updateUserProfile(req.user.userId, updates);
            return res.json(user);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

	async updateUserStatus(req, res) {
		try {
			const userId = req.user.userId;
			const { status } = req.body;
			
			if (!status) {
				return res.status(400).json({ error: 'Status is required' });
			}
			
			await userService.updateUserStatus(userId, status);
			
			return res.json({ 
				success: true, 
				message: 'Status updated successfully',
				status: status 
			});
		} catch (error) {
			if (error.message === 'Invalid status') {
            	return res.status(400).json({ error: error.message });
			}
			return res.status(500).json({ error: error.message });
		}
	},

    async getAllUsers(req, res) {
        try {
            const { search, roleId, workspaceId, status } = req.query;
            const users = await userService.getAllUsers({ search, roleId, workspaceId, status });
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getUserById(req, res) {
        try {
            const id = req.params.id || req.user?.userId;
            if (!id) {
                return res.status(400).json({ error: 'User ID required' });
            }
            const user = await userService.getUserById(id);
            return res.json(user);
        } catch (error) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

	async createUser(req, res) {
		try {
			const { email, password, name, roleId, dpId } = req.body;
			
			// get admin's workspaceId
			const currentUser = await prisma.user.findUnique({
				where: { userId: req.user.userId },
				select: { workspaceId: true }
			});
			
			if (!currentUser || !currentUser.workspaceId) {
				return res.status(400).json({ 
					success: false, 
					message: 'Current user has no workspace assigned' 
				});
			}
			
			const result = await userService.createUser({
				email,
				password,
				name,
				roleId,
				workspaceId: currentUser.workspaceId,  // user admin's
				dpId
			});
			
			return res.status(201).json({
				success: true,
				message: password ? 'User created successfully' : 'User created with temporary password',
				data: result
			});
		} catch (error) {
            if (error.message === 'Email already exists') {
                return res.status(409).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    },

	async getPasswordRules(req, res) {
	  try {
		res.json({
			success: true,
			rules: {
			minLength: PASSWORD_RULES.minLength,
			maxLength: PASSWORD_RULES.maxLength,
			requireUppercase: PASSWORD_RULES.requireUppercase,
			requireLowercase: PASSWORD_RULES.requireLowercase,
			requireNumbers: PASSWORD_RULES.requireNumbers,
			requireSpecialChars: PASSWORD_RULES.requireSpecialChars,
			}
		});
		} catch (error) {
		res.status(500).json({ 
			success: false, 
			message: error.message 
		});
	  }
	},

    async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { oldPassword, newPassword } = req.body;
            
            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Both old password and new password are required'
                });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters'
                });
            }
            
            const updatedUser = await userService.changePassword(userId, oldPassword, newPassword);
            
            return res.status(200).json({
                success: true,
                message: 'Password changed successfully',
                data: updatedUser
            });
            
        } catch (error) {
			if (error.message.includes('Password must')) {
			return res.status(400).json({
				success: false,
				message: error.message,
				code: 'PASSWORD_RULES_VIOLATION'
			});
			}
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            if (error.message === 'Current password is incorrect') {
                return res.status(401).json({ success: false, message: error.message });
            }
            if (error.message.includes('password')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    },

	async resetUserPassword(req, res) {
		try {
			const { userId } = req.params;
			const { newPassword } = req.body;
			
			if (!newPassword) {
				return res.status(400).json({
					success: false,
					message: 'New password is required'
				});
			}
			
			// Validate password rules
			const validation = validatePassword(newPassword);
			if (!validation.isValid) {
				return res.status(400).json({
					success: false,
					message: validation.errors.join('. '),
					code: 'PASSWORD_RULES_VIOLATION'
				});
			}
			
			const updatedUser = await userService.resetUserPassword(userId, newPassword);
			
			return res.status(200).json({
				success: true,
				message: 'Password reset successfully',
				data: {
					userId: updatedUser.userId,
					userEmail: updatedUser.userEmail,
					userName: updatedUser.userName
				}
			});
			
		} catch (error) {
			if (error.message === 'User not found') {
				return res.status(404).json({ 
					success: false, 
					message: error.message 
				});
			}
			return res.status(500).json({ 
				success: false, 
				message: error.message 
			});
		}
	},

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.updateUserByAdmin(id, req.body);
            res.json(user);
        } catch (error) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('password')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    },

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await userService.deleteUser(id);
            res.status(204).send();
        } catch (error) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
};

module.exports = userController;
