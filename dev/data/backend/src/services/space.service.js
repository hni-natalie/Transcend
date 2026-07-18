const prisma = require('../../prisma/client');

const spaceService = {
    async getAllSpaces(workspaceId) {
        return prisma.space.findMany({
            where: { workspaceId },
            orderBy: { spaceName: 'asc' }
        });
    },

    async getAllSpaceNames(workspaceId) {
        return prisma.space.findMany({
            where: { workspaceId },
            select: { spaceName: true },
            orderBy: { spaceName: 'asc' }
        });
    },

    async getSpaceById(spaceId) {
        return prisma.space.findUnique({
            where: { spaceId: spaceId }
        });
    },

    async createSpace(spaceData) {
        const {
            spaceName,
            workspaceId,
            departmentId,
            keyPersonId,
            accessLevel,
            isPublicBook,
            userCapacity
        } = spaceData;

        const data = {
            spaceName,
            accessLevel,
            isPublicBook,
            userCapacity,

            workspace: {
                connect: { workspaceId }
            },

            keyPerson: {
                connect: { userId: keyPersonId }
            }
        };

        // Optional department
        if (departmentId) {
            data.department = {
                connect: { dpId: departmentId }
            };
        }

        return prisma.space.create({ data });
    },

    async updateSpace(spaceId, spaceData) {
        const space = await prisma.space.findUnique({ where: { spaceId } });
        if (!space) throw new Error('Space not found');

        // Remove undefined fields
        const data = Object.fromEntries(
            Object.entries(spaceData).filter(([_, v]) => v !== undefined)
        );

        // Handle department relation
        if (spaceData.departmentId) {
            data.department = {
                connect: { dpId: spaceData.departmentId }
            };

            delete data.departmentId;
        }

        // Handle keyPerson relation
        if (spaceData.keyPersonId) {
            data.keyPerson = {
                connect: { userId: spaceData.keyPersonId }
            };

            delete data.keyPersonId;
        }

        return prisma.space.update({
            where: { spaceId },
            data
        });
    },

    // Delete 
    async deleteSpace(spaceId) {
		const space = await prisma.space.findUnique({ where: { spaceId } });
		if (!space) 
            throw new Error('Space not found');

		await prisma.space.delete({ where: { spaceId } });
	}    
}

module.exports = spaceService;