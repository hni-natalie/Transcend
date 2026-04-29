const prisma = require('../../prisma/client');
const { MeetingRole } = require('@prisma/client');

const meetingService = {
    // Review 
    async getAllMeetings() {
        return prisma.meeting.findMany({
            orderBy: { meetStart: 'asc' }
        });
    },

    async getMeetingById(meetingId) {
        return prisma.meeting.findUnique({
            where: { meetId: meetingId }
        });
    },

    // Search for meeting that created by the specific user
    async getMeetingByUserId(userId) {
        return prisma.meeting.findMany({
            where: { createdByUserId: userId }
        });
    },

    // Create 
    async createMeeting(meetingData) {
        const {
            workspaceId,
            spaceId,
            userId,
            meetTitle,
            meetDesc,
            meetStart,
            meetEnd,
            participants = []
        } = meetingData;

        // Ensure creator is always included
        const allParticipants = [...new Set([userId, ...participants])];

        const data = {
            workspace: {
                connect: {
                    workspaceId
                }
            },

            createdByUserId: userId,
            meetTitle,
            meetDesc,
            meetStart,
            meetEnd,

            participants: {
                create: allParticipants.map(uid => ({
                    userId: uid,
                    role: uid === userId ? MeetingRole.organiser : MeetingRole.participant
                }))
            }
        };

        // Only include spaceId if it exists (prevents Prisma "undefined" error)
        if (spaceId) {
            data.space = {
                connect: {
                    spaceId
                }
            };
        }

        return prisma.meeting.create({ data });
    },

    // Update
    async updateMeeting(meetId, userId, meetingData) {
        const meeting = await prisma.meeting.findUnique({ where: { meetId } });
        if (!meeting) throw new Error('Meeting not found');

        if (meeting.createdByUserId !== userId) {
            throw new Error('Unauthorized to update this meeting');
        }

        // Remove undefined fields
        const data = Object.fromEntries(
            Object.entries(meetingData).filter(([_, v]) => v !== undefined)
        );

        return prisma.meeting.update({
            where: { meetId },
            data
        });
    },

    // Update New Participant
    async addParticipant(meetId, userId, newUser) {
        const meeting = await prisma.meeting.findUnique({ where: { meetId } });
        if (!meeting) throw new Error('Meeting not found');

        if (meeting.createdByUserId !== userId)
            throw new Error('Unauthorized to update this meeting');

        return prisma.meetingParticipant.create({
            where: {
                meetId,
                userId: newUser.userId,
                role: newUser.role ?? MeetingRole.participant
            }
        });
    },

    // Update Current Participant
    async updateParticipant(meetId, userId, curUser) {
        const meeting = await prisma.meeting.findUnique({ where: { meetId } });
        if (!meeting) throw new Error('Meeting not found');

        if (meeting.createdByUserId !== userId)
            throw new Error('Unauthorized to update this meeting');

        // Check participant exists
        const participant = await prisma.meetingParticipant.findUnique({
            where: {
                meetId_userId: {
                    meetId,
                    userId: curUser.userId
                }
            }
        });

        if (!participant) 
            throw new Error('Participant not found');

        // Update participant
        return prisma.meetingParticipant.update({
            where: {
                meetId_userId: {
                    meetId,
                    userId: curUser.userId
                }
            },
            data: {
                role: curUser.role ?? "participant"
            }
        });
    },

    // Delete Participant
    async removeParticipant(meetId, userId, targetUserId) {
        const meeting = await prisma.meeting.findUnique({ where: { meetId } });
        if (!meeting) 
            throw new Error('Meeting not found');

        if (meeting.createdByUserId !== userId)
            throw new Error('Unauthorized to update this meeting');

        return prisma.meetingParticipant.deleteMany({
            where: {
                meetId,
                userId: targetUserId
            }
        });
    },

    // Delete 
    async deleteMeeting(meetId, userId) {
		const meeting = await prisma.meeting.findUnique({ where: { meetId } });
		if (!meeting) 
            throw new Error('Meeting not found');
		
        if (meeting.createdByUserId !== userId) 
            throw new Error('Unauthorized to delete this meeting');

		await prisma.meeting.delete({ where: { meetId } });
	}

}

module.exports = meetingService;