const meetingService = require('../services/meeting.service');
const { getIO } = require("../services/socket.service");
const { validateCreateMeeting, validateUpdateMeeting, validateSyncParticipants } = require('../validators/meeting.validator');

const meetingController = {
    async getAllMeetings(req, res) {
        try {
            const userId = req.user.userId;
            
            const meetings = await meetingService.getAllMeetings(userId);
            return res.status(200).json({ success: true, data: meetings });
        } catch (error) {
            console.error('Error fetching meetings:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
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
			console.error('Error fetching meeting:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
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
            console.error('Error fetching meetings by user:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
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
            console.error('Error fetching meetings by participant:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
        }
    },

    async createMeeting(req, res) {
        try {
            let validatedData;
            try {
                validatedData = validateCreateMeeting({
                    workspaceId: req.user.workspaceId,
                    spaceId: req.body.spaceId,
                    meetTitle: req.body.meetTitle,
                    meetDesc: req.body.meetDesc,
                    meetStart: req.body.meetStart,
                    meetEnd: req.body.meetEnd,
					participantIds: req.body.participantIds
                });
            } catch (validationErr) {
                return res.status(400).json({ success: false, message: validationErr.message });
            }

            const userId = req.user.userId;

            const meeting = await meetingService.createMeeting({
                ...validatedData,
                userId
            });

            getIO().emit("meetingUpdated");

            return res.status(201).json({ success: true, data: meeting });
        } catch (error) {
            if (error.message.includes('conflict'))
                return res.status(409).json({ success: false, message: error.message });
            
            console.error('Error creating meeting:', error);
            return res.status(500).json({ success: false, message: 'Failed to create meeting' });
        }
    },

    async updateMeeting(req, res) {
        try {
            let validatedData;
            try {
                validatedData = validateUpdateMeeting({
                    meetId: req.body.meetId,
                    meetTitle: req.body.meetTitle,
                    meetDesc: req.body.meetDesc,
                    meetStart: req.body.meetStart,
                    meetEnd: req.body.meetEnd
                });
            } catch (validationErr) {
                return res.status(400).json({ success: false, message: validationErr.message });
            }

            if (Object.keys(validatedData).length <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            const userId = req.user.userId;

            const meeting = await meetingService.updateMeeting(
                validatedData.meetId,
                userId,
                validatedData
            );

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: meeting });
        } catch (error) {
            if (error.message === 'Meeting not found') 
                return res.status(404).json({ success: false, message: error.message });

            if (error.message.includes('Unauthorized'))
                return res.status(403).json({ success: false, message: error.message });
            
            console.error('Error updating meeting:', error);
            return res.status(500).json({ success: false, message: 'Failed to update meeting' });
        }
    },

    async syncParticipants(req, res) {
        try {
            let validatedData;
            try {
                validatedData = validateSyncParticipants({
                    meetId: req.body.meetId,
                    participants: req.body.participants,
                    meetStart: req.body.meetStart,
                    meetEnd: req.body.meetEnd
                });
            } catch (validationErr) {
                return res.status(400).json({ success: false, message: validationErr.message });
            }

            const userId = req.user.userId;

            const result = await meetingService.syncParticipants(
                validatedData.meetId,
                userId,
                validatedData.participants,
                validatedData.meetStart,
                validatedData.meetEnd
            );

            getIO().emit("meetingUpdated");

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.message === 'Meeting not found')
                return res.status(404).json({ success: false, message: error.message });

            if (error.message.includes('Unauthorized'))
                return res.status(403).json({ success: false, message: error.message });

            if (error.message.includes('conflict'))
                return res.status(409).json({ success: false, message: error.message });
            
            console.error('Error syncing participants:', error);
            return res.status(500).json({ success: false, message: 'Failed to sync participants' });
        }
    },

    async deleteMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId)
                return res.status(400).json({ success: false, message: 'Meeting ID is required' });

            const result = await meetingService.deleteMeeting(meetId, userId);

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            if (error.message === 'Meeting not found')
                return res.status(404).json({ success: false, message: error.message });

            if (error.message.includes('Unauthorized'))
                return res.status(403).json({ success: false, message: error.message });
            
            console.error('Error deleting meeting:', error);
            return res.status(500).json({ success: false, message: 'Failed to delete meeting' });
        }
    },

    async toggleMeetingPin(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId)
                return res.status(400).json({ success: false, message: 'Meeting ID is required' });

            const updated = await meetingService.togglePin(meetId, userId);

            return res.status(200).json({ success: true, data: updated });
        } catch (err) {
            if (err.message === 'Meeting not found')
                return res.status(404).json({ success: false, message: err.message });
            
            console.error('Error toggling pin:', err);
            return res.status(500).json({ success: false, message: 'Failed to toggle pin' });
        }
    },

    async getAllMeetingPin(req, res) {
        try {
            const result = await meetingService.getAllMeetingPin();
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            console.error('Error fetching pins:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch pins' });
        }
    },

    async startMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId)
                return res.status(400).json({ success: false, message: 'Meeting ID is required' });

            const updatedMeeting = await meetingService.startMeeting(meetId, userId);

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: updatedMeeting });
        } catch (err) {
            if (err.message === 'Meeting not found')
                return res.status(404).json({ success: false, message: err.message });

            if (err.message.includes('Unauthorized'))
                return res.status(403).json({ success: false, message: err.message });

            console.error('Error starting meeting:', err);
            return res.status(500).json({ success: false, message: 'Failed to start meeting' });
        }
    },

    async endMeeting(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId)
                return res.status(400).json({ success: false, message: 'Meeting ID is required' });

            const updatedMeeting = await meetingService.endMeeting(meetId, userId);

            getIO().emit("meetingUpdated");

            return res.status(200).json({ success: true, data: updatedMeeting });
        } catch (err) {
            if (err.message === 'Meeting not found')
                return res.status(404).json({ success: false, message: err.message });

            if (err.message.includes('Unauthorized'))
                return res.status(403).json({ success: false, message: err.message });
            
            console.error('Error ending meeting:', err);
            return res.status(500).json({ success: false, message: 'Failed to end meeting' });
        }
    }
};

module.exports = meetingController;
