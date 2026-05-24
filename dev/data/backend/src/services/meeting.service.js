const prisma = require('../../prisma/client');
const { MeetingRole } = require('@prisma/client');
const { validateMeeting } = require('../validators/meeting.validator');

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

    // Search for meeting that user joined
    async getMeetingByParticipantId(userId) {
        return prisma.meetingParticipant.findMany({
            where: { userId, role: { not: MeetingRole.organiser } }
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

        await validateMeeting({
            participantIds: allParticipants,
            meetStart,
            meetEnd
        });

        const data = {
            workspace: {
                connect: {
                    workspaceId
                }
            },

            space: {
                connect: {
                    spaceId
                }
            },

            createdBy: {
                connect: {
                    userId
                }
            },

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

        return prisma.meeting.create({ data });
    },

    // Update
    async updateMeeting(meetId, userId, data) {
        const {
            meetTitle,
            meetDesc,
            meetStart,
            meetEnd,
            addParticipants = []
        } = data;

        const meeting = await prisma.meeting.findUnique({ where: { meetId } });

        if (!meeting) 
            throw new Error("Meeting not found");

        if (meeting.createdByUserId !== userId)
            throw new Error('Unauthorized to update this meeting');

        const existingParticipants = await prisma.meetingParticipant.findMany({
            where: { meetId },
            select: { userId: true }
        });

        const existingUserIds = existingParticipants.map(p => p.userId);

        const allParticipants = [
            ...new Set([
                userId,
                ...existingUserIds,
                ...addParticipants
            ])
        ];

        // Validate time if changed
        if (meetStart || meetEnd) {
            await validateMeeting({
                participantIds: allParticipants,
                meetStart: meetStart ?? meeting.meetStart,
                meetEnd: meetEnd ?? meeting.meetEnd,
                excludeMeetId: meetId
            });
        }

        // Add participants
        if (addParticipants.length > 0) {
            await prisma.meetingParticipant.createMany({
                data: addParticipants.map(uid => ({
                    meetId,
                    userId: uid,
                    role: MeetingRole.participant
                }))
            });
        }

        // Update meeting
        return prisma.meeting.update({
            where: { meetId },
            data: {
                meetTitle,
                meetDesc,
                meetStart,
                meetEnd
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
                role: curUser.role ?? "participant",
                attendance: curUser.attendance
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

        await prisma.meetingParticipant.deleteMany({ where: { meetId } });
		await prisma.meeting.delete({ where: { meetId } });
	}, 

    // Toggle pin
    async togglePin(meetId) {
        // 1. Find the MEETING (not participant)
        const meeting = await prisma.meeting.findUnique({
            where: { meetId: meetId }
        });

        if (!meeting)
            throw new Error('Meeting not found');

        // 2. Update the MEETING (correct table!)
        return prisma.meeting.update({
            where: { meetId: meetId },
            data: { isPinned: !meeting.isPinned }
        });
    }

}

module.exports = meetingService;