const prisma = require('../../prisma/client');
const userService = require('../services/user.service');
const { validatePassword, PASSWORD_RULES } = require('../utils/password');
const {
    validateCreateUser,
    validateUpdateUserByAdmin,
    validateUpdateProfile,
    validateUserStatus,
    validateChangePassword,
    validateResetPassword
} = require('../validators/user.validator');

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

            try {
                const validated = validateUpdateProfile(updates);
                Object.keys(validated).forEach(key => {
                    if (validated[key] !== undefined) updates[key] = validated[key];
                });
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
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
			let status;
			try {
				({ status } = validateUserStatus(req.body));
			} catch (validationErr) {
				return res.status(400).json({ error: validationErr.message });
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

    async getUsersByStatus(req, res) {
        try {
            const status = req.params.status;
            console.log(`📥 Getting users with status: "${status}"`);

            if (!status) {
                return res.status(400).json({ error: 'User status required' });
            }
            const user = await userService.getUsersByStatus(status);
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
			let validated;
			try {
				validated = validateCreateUser(req.body);
			} catch (validationErr) {
				return res.status(400).json({ success: false, message: validationErr.message });
			}
			const { email, password, name, roleId, dpId, userTitle } = validated;
			
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
				dpId,
				userTitle
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
            let oldPassword, newPassword;
            try {
                ({ oldPassword, newPassword } = validateChangePassword(req.body));
            } catch (validationErr) {
                return res.status(400).json({
                    success: false,
                    message: validationErr.message,
                    code: 'PASSWORD_RULES_VIOLATION'
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
			if (!userId) {
				return res.status(400).json({ success: false, message: 'User ID is required' });
			}

			let newPassword;
			try {
				({ newPassword } = validateResetPassword(req.body));
			} catch (validationErr) {
				return res.status(400).json({
					success: false,
					message: validationErr.message,
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
            if (!id) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            let validated;
            try {
                validated = validateUpdateUserByAdmin(req.body);
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
            }

            const user = await userService.updateUserByAdmin(id, validated);
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
    },

    async getMyDataExport(req, res) {
        try {
            const userId = req.user.userId;
            const result = await userService.exportUserData(userId);
            return res.json({ success: true, ...result });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async requestAccountDeletion(req, res) {
        try {
            const userId = req.user.userId;
            const result = await userService.requestAccountDeletion(userId);
            return res.json({
                success: true,
                message: result.alreadyRequested
                    ? 'A deletion request is already pending for your account.'
                    : 'Your deletion request has been received.',
                ...result,
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
	}

};

module.exports = userController;