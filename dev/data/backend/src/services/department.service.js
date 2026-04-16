const prisma = require('../../prisma/client');

const departmentService = {
    async getAllDepartments(workspaceId) {
        return prisma.department.findMany({
            where: { workspaceId },
            orderBy: { dpName: 'asc' }
        });
    },

    async getDepartmentById(dpId) {
        return prisma.department.findUnique({
            where: { dpId: dpId }
        });
    },

    async createDepartment(data) {
        return prisma.department.create({
            data: {
                dpName: data.dpName,
                workspaceId: data.workspaceId
            }
        });
    }

    // extra feature for later
    // async deleteDepartment(dpId) {
    //     return prisma.department.delete({
    //         where: { dpId: dpId }
    //     });
    // }
};

module.exports = departmentService;