const prisma = require('../../prisma/client');

const meetingChatService = {

    async createChatMessage(data) {
        const { meetId, senderId, message } = data;

        if (!meetId || !message) {
            throw new Error("Missing required fields");
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetId },
            include: { participants: true }
        });

        if (!meeting) {
            throw new Error("Meeting not found");
        }

        const isCreator = meeting.createdByUserId === senderId;
        const isParticipant = meeting.participants.some(
            participant => participant.userId === senderId
        );

        if (!isCreator && !isParticipant) {
            throw new Error("FORBIDDEN");
        }

        const user = await prisma.user.findUnique({
            where: { userId: senderId },
            select: { userName: true }
        });

        if (!user) {
            throw new Error("User not found");
        }

        return await prisma.meetingChatMessage.create({
            data: {
                meetId,
                senderId,
                senderName: user.userName,
                message,
            },
        });
    },

    async getMeetingChat(meetId, userId) {
        if (!meetId) {
            throw new Error("Meeting ID is required");
        }

        const meeting = await prisma.meeting.findUnique({
            where: { meetId },
            include: { participants: true }
        });

        if (!meeting) {
            throw new Error("Meeting not found");
        }

        const isCreator = meeting.createdByUserId === userId;
        const isParticipant = meeting.participants.some(
            participant => participant.userId === userId
        );

        if (!isCreator && !isParticipant) {
            throw new Error("FORBIDDEN");
        }

        return await prisma.meetingChatMessage.findMany({
            where: { meetId },
            orderBy: {
                createdAt: "asc"
            }
        });
    },

};

module.exports = meetingChatService;