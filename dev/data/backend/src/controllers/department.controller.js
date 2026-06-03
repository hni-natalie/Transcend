const departmentService = require('../services/department.service');

const departmentController = {
    async getAllDepartments(req, res) {
        try {
            const departments = await departmentService.getAllDepartments(req.workspaceId);
            return res.status(200).json({ success: true, data: departments });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getAllDepartmentNames(req, res) {
        try {
            const departments = await departmentService.getAllDepartmentNames(req.workspaceId);
            return res.status(200).json({ success: true, data: departments });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getDepartmentById(req, res) {
        try {
            const { dpId } = req.params;

            if (!dpId) {
                return res.status(400).json({ success: false, message: 'Department ID is required' });
            }

            const department = await departmentService.getDepartmentById(dpId);

            if (!department) {
                return res.status(404).json({ success: false, message: 'Department not found' });
            }

            return res.status(200).json({ success: true, data: department });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async createDepartment(req, res) {
        try {
            const { dpName, workspaceId } = req.body;

            if (!dpName) {
                return res.status(400).json({ success: false, message: 'Department name is required' });
            }
            if (!workspaceId) {
                return res.status(400).json({ success: false, message: 'Workspace ID is required' });
            }

            const department = await departmentService.createDepartment({ dpName, workspaceId });
            return res.status(201).json({ success: true, data: department });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // extra feature for later
    // async deleteDepartment(req, res) {
    //     try {
    //         const { dpId } = req.params;
    //         
    //         if (!dpId) {
    //             return res.status(400).json({ success: false, message: 'Department ID is required' });
    //         }
    //         
    //         await departmentService.deleteDepartment(dpId);
    //         return res.status(204).send();
    //     } catch (error) {
    //         if (error.message === 'Department not found') {
    //             return res.status(404).json({ success: false, message: error.message });
    //         }
    //         return res.status(500).json({ success: false, message: error.message });
    //     }
    // }
};

module.exports = departmentController;