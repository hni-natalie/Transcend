const meetingChatService = require('../services/meetingChat.service');

const meetingChatController = {

    async createChatMessage(req, res) {
        try {
            console.log("CONTROLLER PARAMS:", req.params);
            console.log("CONTROLLER BODY:", req.body);
            const { meetId } = req.params;
            const {
                senderId,
                senderName,
                message
            } = req.body;

            if (!meetId || !message) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }

            const chatMessage = await meetingChatService.createChatMessage({
                meetId,
                senderId,
                senderName,
                message,
            });

            return res.status(201).json({
                success: true,
                data: chatMessage,
            });

        } catch (error) {
            console.error("Create chat message error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to save chat message",
            });
        }
    },


    async getMeetingChat(req, res) {
        try {
            const { meetId } = req.params;

            if (!meetId) {
                return res.status(400).json({
                    success: false,
                    message: "Meeting ID is required",
                });
            }

            const chatMessages =
                await meetingChatService.getMeetingChat(meetId);

            return res.status(200).json({
                success: true,
                data: chatMessages,
            });

        } catch (error) {
            console.error("Get meeting chat error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to get meeting chat",
            });
        }
    },

};

module.exports = meetingChatController;