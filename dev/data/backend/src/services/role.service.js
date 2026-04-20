const prisma = require('../../prisma/client');

const roleService = {
    async getAllRoles() {
        return prisma.role.findMany({
            orderBy: { roleName: 'asc' }
        });
    },

    async getRoleById(roleId) {
        return prisma.role.findUnique({
            where: { roleId: roleId }
        });
    },

    async createRole(data) {
        return prisma.role.create({
            data: { roleName: data.roleName }
        });
    }

    // extra feature for later
    // async updateRole(roleId, roleName) {
    //     return prisma.role.update({
    //         where: { roleId: roleId },
    //         data: { roleName: roleName }
    //     });
    // },

    // async deleteRole(roleId) {
    //     return prisma.role.delete({
    //         where: { roleId: roleId }
    //     });
    // }
};

module.exports = roleService;