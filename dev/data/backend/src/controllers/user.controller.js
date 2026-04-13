const userService = require('../services/user.service');

async function getAllUsers(req, res) {
    try {
        const { search, roleId, workspaceId, status } = req.query;
        const users = await userService.getAllUsers({ search, roleId, workspaceId, status });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getUserById(req, res) {
	try {
		// if no id provided (../users/me), use the logged-in user's id
		const id = req.params.id || req.user?.userId;
		if (!id) {
			return res.status(400).json({ error: 'User ID required' });
		}
		const user = await userService.getUserById(id);
		res.json(user);
	} catch (error) {
		if (error.message === 'User not found') {
			res.status(404).json({ error: error.message });
		} else {
			res.status(500).json({ error: error.message });
		}
	}
}

async function createUser(req, res) {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Email already exists') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
}

async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const user = await userService.updateUser(id, req.body);
        res.json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
}

async function deleteUser(req, res) {
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

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};