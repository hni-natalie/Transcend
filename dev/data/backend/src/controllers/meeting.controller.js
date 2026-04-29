const meetingService = require('../services/meeting.service');

const meetingController = {
    async getAllMeetings(req, res) {
        try {
            const meetings = await meetingService.getAllMeetings();
            return res.status(200).json({ success: true, data: meetings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getMeetingById(req, res) {
        try {
            const { meetingId } = req.params;

            if (!meetingId) 
                return res.status(400).json({ success: false, message: 'Meeting ID is required' });

            const meeting = await meetingService.getMeetingById(meetingId);

            if (!meeting)
                return res.status(404).json({ success: false, message: 'Meeting not found' });

            return res.status(200).json({ success: true, data: meeting });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getMeetingByUserId(req, res) {
        try {
            const { userId } = req.params;

            if (!userId)
                return res.status(400).json({ success: false, message: 'User ID is required' });

            const meeting = await meetingService.getMeetingByUserId(userId);

            if (!meeting) 
                return res.status(404).json({ success: false, message: 'Meeting not found' });

            return res.status(200).json({ success: true, data: meeting });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async createMeeting(req, res) {
        try {
            const {
                workspaceId,
                spaceId,
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd,
                participants = []
            } = req.body;

            const userId = req.user.userId;

            const meeting = await meetingService.createMeeting({
                workspaceId,
                spaceId,
                userId,
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd,
                participants
            });

            return res.status(201).json({ success: true, data: meeting });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async updateMeeting(req, res) {
        try {
            const {
                meetId,
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd
            } = req.body;

            const userId = req.user.userId;

            const meeting = await meetingService.updateMeeting(
                meetId,
                userId,
                {
                    meetTitle,
                    meetDesc,
                    meetStart,
                    meetEnd
                }
            );

            return res.status(200).json({ success: true, data: meeting });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async addParticipant(req, res) {
        try {
            const {
                meetId,
                newUserId,
                role
            } = req.body;

            const userId = req.user.userId;

            const result = await meetingService.addParticipant(
                meetId,
                userId,
                {
                    userId: newUserId,
                    role
                }
            );

            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async updateParticipant(req, res) {
        try {
            const {
                meetId,
                targetUserId,
                role
            } = req.body;

            const userId = req.user.userId;

            const result = await meetingService.updateParticipant(
                meetId,
                userId,
                {
                    userId: targetUserId,
                    role
                }
            );

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async removeParticipant(req, res) {
        try {
            const { meetId, targetUserId } = req.params;
            const userId = req.user.userId;

            const result = await meetingService.removeParticipant(
                meetId,
                userId,
                targetUserId
            );

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async deleteMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            const result = await meetingService.deleteMeeting( meetId, userId );

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = meetingController; 
