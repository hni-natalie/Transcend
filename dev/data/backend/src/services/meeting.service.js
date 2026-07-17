const prisma = require('../../prisma/client');
const { MeetingRole } = require('@prisma/client');
const { validateMeeting } = require('../validators/meeting.validator');

const meetingService = {
    // Search for meeting that created and invited by the specific user
    async getAllMeetings(userId) {
        const meetings = await prisma.meeting.findMany({
            include: {
                _count: {
                    select: {
                        participants: true
                    }
                }
            }
        });

        // fetch all pins for this user once
        const pins = await prisma.meetingPin.findMany({
            where: { userId },
            select: { meetId: true }
        });

        const pinnedSet = new Set(pins.map(p => p.meetId));

        return meetings.map(meeting => ({
            ...meeting,
            pinned: pinnedSet.has(meeting.meetId)
        }));
    },

    async getMeetingById(meetingId) {
        return prisma.meeting.findUnique({
            where: { meetId: meetingId },
            include: {
                participants: {
                    select: {
                        role: true,
                        attendance: true,
                        user: {
                            select: {
                                userName: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        participants: true
                    }
                }
            }
        });
    },

    // Search for meeting that created by the specific user
    async getMeetingByUserId(userId) {
        // 1. get meetings created by this user
        const meetings = await prisma.meeting.findMany({
            where: {
                createdByUserId: userId,
            },
            include: {
                _count: {
                    select: {
                    participants: true,
                    },
                },
            },
            orderBy: {
                meetStart: 'desc',
            },
        });

        // 2. fetch all pins for this user (single query)
        const pins = await prisma.meetingPin.findMany({
            where: { userId },
            select: { meetId: true },
        });

        const pinnedSet = new Set(pins.map(p => p.meetId));

        // 3. attach pinned flag
        return meetings.map(meeting => ({
            ...meeting,
            pinned: pinnedSet.has(meeting.meetId),
        }));
    },

    // Search for meeting that user joined
    // Get all meetings that the user created or joined
    async getMeetingByParticipantId(userId) {
        // 1. Get all meetings where the user is either:
        //    - the creator
        //    - a participant
        const meetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    {
                        createdByUserId: userId,
                    },
                    {
                        participants: {
                            some: {
                                userId,
                            },
                        },
                    },
                ],
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
            orderBy: {
                meetStart: 'desc',
            },
        });

        // 2. Get all pinned meetings for this user
        const pins = await prisma.meetingPin.findMany({
            where: { userId },
            select: { meetId: true },
        });

        const pinnedSet = new Set(pins.map((p) => p.meetId));

        // 3. Attach pinned flag
        return meetings.map((meeting) => ({
            ...meeting,
            pinned: pinnedSet.has(meeting.meetId),
        }));
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
            userId, 
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

    async togglePin(meetId, userId) {
        // Ensure meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

        if (!meeting) { throw new Error('Meeting not found'); }

        // Check if already pinned by THIS user
        const existingPin = await prisma.meetingPin.findUnique({
            where: {
                userId_meetId: { userId, meetId, }
            }
        });

        // 3. Toggle
        if (existingPin) {
            // Unpin
            await prisma.meetingPin.delete({
                where: {
                    userId_meetId: { userId, meetId, }
                }
            });

            return { pinned: false };
        }

        // Pin
        await prisma.meetingPin.create({
            data: { userId, meetId, }
        });

        return { pinned: true };
    },

    async getAllMeetingPin() {
        return prisma.meetingPin.findMany({});
    }
}

module.exports = meetingService;