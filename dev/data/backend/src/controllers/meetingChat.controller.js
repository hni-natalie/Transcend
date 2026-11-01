const meetingChatService = require('../services/meetingChat.service');

const {
    validateId,
    validateText
} = require('../validators/common.validator');

const MESSAGE_MAX_LENGTH = 1000;

const meetingChatController = {

    async createChatMessage(req, res) {
        try {
            const { meetId } = req.params;
            const { message } = req.body;

            validateId(meetId, 'Meeting ID');
            validateText(
                message,
                'Message',
                MESSAGE_MAX_LENGTH,
                true
            );

            const senderId = req.user.userId;

            const chatMessage =
                await meetingChatService.createChatMessage({
                    meetId,
                    senderId,
                    message: message.trim(),
                });

            return res.status(201).json({
                success: true,
                data: chatMessage,
            });

        } catch (error) {
            console.error("Create chat message error:", error);

            if (
                error.message.includes('required') ||
                error.message.includes('Invalid') ||
                error.message.includes('must be') ||
                error.message.includes('cannot be') ||
                error.message.includes('contains')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'FORBIDDEN') {
                return res.status(403).json({
                    success: false,
                    message: 'You are not allowed to access this meeting',
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to save chat message',
            });
        }
    },

    async getMeetingChat(req, res) {
        try {
            const { meetId } = req.params;

            validateId(meetId, 'Meeting ID');

            const chatMessages =
                await meetingChatService.getMeetingChat(
                    meetId,
                    req.user.userId
                );

            return res.status(200).json({
                success: true,
                data: chatMessages,
            });

        } catch (error) {
            console.error("Get meeting chat error:", error);

            if (
                error.message.includes('required') ||
                error.message.includes('Invalid') ||
                error.message.includes('must be')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'FORBIDDEN') {
                return res.status(403).json({
                    success: false,
                    message: 'You are not allowed to access this meeting',
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to get meeting chat',
            });
        }
    },

};

module.exports = meetingChatController;