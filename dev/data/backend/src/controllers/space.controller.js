const spaceService = require('../services/space.service');

const spaceController = {
    async getAllSpaces(req, res) {
        try {
            const spaces = await spaceService.getAllSpaces(req.workspaceId);
            return res.status(200).json({ success: true, data: spaces });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getAllSpaceNames(req, res) {
        try {
            const spaces = await spaceService.getAllSpaceNames(req.workspaceId);
            return res.status(200).json({ success: true, data: spaces });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getSpaceById(req, res) {
        try {
            const { spaceId } = req.params;

            if (!spaceId) 
                return res.status(400).json({ success: false, message: 'Space ID is required' });

            const space = await spaceService.getSpaceById(spaceId);

            if (!space)
                return res.status(404).json({ success: false, message: 'Space not found' });

            return res.status(200).json({ success: true, data: space });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async createSpace(req, res) {
        try {
            const {
                spaceName,
                workspaceId,
                accessLevel,
                departmentId,
                keyPersonId,
                isPublicBook,
                userCapacity
            } = req.body;

            const userId = req.user.userId;

            const space = await spaceService.createSpace({
                spaceName,
                workspaceId,
                accessLevel,
                departmentId,
                keyPersonId: keyPersonId ?? userId,
                isPublicBook,
                userCapacity
            });

            return res.status(201).json({ success: true, data: space });
        } catch(error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async updateSpace(req, res) {
        try {
            const {
                spaceId,
                spaceName,
                accessLevel,
                keyPersonId,
                departmentId,
                isPublicBook,
                userCapacity
            } = req.body;

            const updatedSpace = await spaceService.updateSpace(
                spaceId,
                {
                    spaceName,
                    accessLevel,
                    isPublicBook,
                    userCapacity,
                    keyPersonId,
                    departmentId
                }
            );

            return res.status(200).json({ success: true, data: updatedSpace });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async deleteSpace(req, res) {
        try {
            const { spaceId } = req.params;

            const space = await spaceService.deleteSpace(spaceId);

            return res.status(200).json({ success: true, data: space });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = spaceController; 
