const meetingService = require('../services/meeting.service');
const { getIO } = require("../services/socket.service");

const meetingController = {
    async getAllMeetings(req, res) {
        try {
            const userId = req.user.userId;
            
            const meetings = await meetingService.getAllMeetings(userId);
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

    // Meeting Created by User 
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

    // Meeting that User Joined
    async getMeetingByParticipantId(req, res) {
        try {
            const { userId } = req.params;

            if (!userId)
                return res.status(400).json({ success: false, message: 'User ID is required' });

            const meeting = await meetingService.getMeetingByParticipantId(userId);

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
                spaceId,
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd
            } = req.body;

            const userId = req.user.userId;
            const workspaceId = req.user.workspaceId;

            const meeting = await meetingService.createMeeting({
                workspaceId,
                spaceId,
                userId,
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd
            });

            getIO().emit("meetingUpdated");

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

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: meeting });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async syncParticipants(req, res) {
        try {
            const {
                meetId,
                participants,
                meetStart,
                meetEnd
            } = req.body;

            const userId = req.user.userId;

            const result = await meetingService.syncParticipants(
                meetId,
                userId,
                participants,
                meetStart,
                meetEnd
            );

            getIO().emit("meetingUpdated");

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async deleteMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            const result = await meetingService.deleteMeeting( meetId, userId );

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async toggleMeetingPin(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            const updated = await meetingService.togglePin( meetId, userId );

            return res.status(200).json({ success: true, data: updated });
        } catch (err) {
            return res.status(400).json({
                message: err.message
            });
        }
    },

    async getAllMeetingPin(req, res) {
        try {
            const result = await meetingService.getAllMeetingPin();

            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            return res.status(400).json({
                message: err.message
            });
        }
    }, 

    async startMeeting(req, res) { 
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            const updatedMeeting = await meetingService.startMeeting(meetId, userId);

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: updatedMeeting });
        } catch (err) {
            return res.status(400).json({
                message: err.message
            });
        }
    },

    async endMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            const updatedMeeting = await meetingService.endMeeting(meetId, userId);

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: updatedMeeting });
        } catch (err) {
            return res.status(400).json({
                message: err.message
            });
        }
    }
};

module.exports = meetingController; 
