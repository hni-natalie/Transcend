const recordingService = require('../services/recording.service');

const recordingController = {
    async startRecording(req, res) {
        try {
            const { meetId } = req.body;
            const userId = req.user.userId;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const recording = await recordingService.startRecording(meetId, userId);

            return res.status(200).json({ success: true, data: recording });
        } catch (error) {
            console.error(error);

            if (error.message === 'Meeting not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async stopRecording(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const recording = await recordingService.stopRecording( meetId, userId );

            return res.status(200).json({ success: true, data: recording, });
        } catch (error) {
            if (error.message === 'Meeting not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async finalizeRecordings(req, res) {
        try {
            await recordingService.finalizeRecordings();

            return res.status(200).json({
                success: true,
                message: 'Recording finalization completed.',
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    async getRecordings(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const recordings = await recordingService.getRecordings( meetId, userId );

            return res.json({ success: true, recordings, });
        } catch (error) {
            if (error.message === 'Meeting not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({ success: false, message: error.message, });
        }
    },

    async getRecordingStatus(req, res) {
        try {
            const { meetId } = req.params;
            const userId = req.user.userId;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const status = await recordingService.getRecordingStatus(meetId, userId);

            return res.json({ success: true, status });
        } catch (error) {
            if (error.message === 'Meeting not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({ success: false, message: error.message, });
        }
    },
};

module.exports = recordingController;