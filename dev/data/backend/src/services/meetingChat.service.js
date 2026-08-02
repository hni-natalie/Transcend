const prisma = require('../../prisma/client');

const meetingChatService = {

    async createChatMessage(data) {
        const {
            meetId,
            senderId,
            senderName,
            message
        } = data;

        if (!meetId || !message) {
            throw new Error("Missing required fields");
        }

        return await prisma.meetingChatMessage.create({
            data: {
                meetId,
                senderId,
                senderName,
                message,
            },
        });
    },


    async getMeetingChat(meetId) {

        if (!meetId) {
            throw new Error("Meeting ID is required");
        }

        return await prisma.meetingChatMessage.findMany({
            where: {
                meetId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
    },

};

module.exports = meetingChatService;