const userService = require('../services/user.service');

const userController = {
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
            const allowedUpdates = ['city', 'country', 'timezone'];
            const updates = {};
            
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });
            
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ 
                    error: 'No valid fields to update. Allowed: city, country, timezone' 
                });
            }
            
            const user = await userService.updateUserProfile(req.user.userId, updates);
            return res.json(user);
        } catch (error) {
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
            const { email, password, name, roleId, workspaceId, dpId } = req.body;
            
            const result = await userService.createUser({
                email, password, name, roleId, workspaceId, dpId
            });
            
            // result will show temp password
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

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.updateUserByAdmin(id, req.body);
            res.json(user);
        } catch (error) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
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