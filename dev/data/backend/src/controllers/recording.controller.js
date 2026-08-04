const recordingService = require('../services/recording.service');

const recordingController = {
    async startRecording(req, res) {
        try {
            const { meetId } = req.body;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const recording = await recordingService.startRecording(meetId);

            return res.status(200).json({
                success: true,
                data: recording,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    async stopRecording(req, res) {
        try {
            const { meetId } = req.params;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: 'Meeting ID is required',
                });
            }

            const recording = await recordingService.stopRecording(meetId);

            return res.status(200).json({
                success: true,
                data: recording,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
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

            const recordings = await recordingService.getRecordings(meetId);

            return res.json({ success: true, recordings, });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, });
        }
    },
};

module.exports = recordingController;