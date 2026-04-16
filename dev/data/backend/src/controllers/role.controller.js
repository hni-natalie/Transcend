const roleService = require('../services/role.service');

const roleController = {
    async getAllRoles(req, res) {
        try {
            const roles = await roleService.getAllRoles();
            return res.status(200).json({ success: true, data: roles });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getRoleById(req, res) {
        try {
            const { roleId } = req.params;

            if (!roleId) {
                return res.status(400).json({ success: false, message: 'Role ID is required' });
            }

            const role = await roleService.getRoleById(roleId);

            if (!role) {
                return res.status(404).json({ success: false, message: 'Role not found' });
            }

            return res.status(200).json({ success: true, data: role });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async createRole(req, res) {
        try {
            const { roleName } = req.body;

            if (!roleName) {
                return res.status(400).json({ success: false, message: 'Role name is required' });
            }

            const role = await roleService.createRole({ roleName });
            return res.status(201).json({ success: true, data: role });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // extra feature for later
    // async updateRole(req, res) {
    //     try {
    //         const { roleId } = req.params;
    //         const { roleName } = req.body;
    //
    //         if (!roleId) {
    //             return res.status(400).json({ success: false, message: 'Role ID is required' });
    //         }
    //         if (!roleName) {
    //             return res.status(400).json({ success: false, message: 'Role name is required' });
    //         }
    //
    //         const role = await roleService.updateRole(roleId, roleName);
    //
    //         if (!role) {
    //             return res.status(404).json({ success: false, message: 'Role not found' });
    //         }
    //
    //         return res.status(200).json({ success: true, data: role });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // },
    //
    // async deleteRole(req, res) {
    //     try {
    //         const { roleId } = req.params;
    //
    //         if (!roleId) {
    //             return res.status(400).json({ success: false, message: 'Role ID is required' });
    //         }
    //
    //         await roleService.deleteRole(roleId);
    //         return res.status(204).send();
    //     } catch (error) {
    //         if (error.message === 'Role not found') {
    //             return res.status(404).json({ success: false, message: error.message });
    //         }
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // }
};

module.exports = roleController;