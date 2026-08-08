const prisma = require('../../prisma/client');
const { MeetingRole, AttendanceStatus } = require('@prisma/client');
const { validateMeetingTime, validateParticipantConflicts } = require('../validators/meeting.validator');
const { logMeetingActivity } = require('../utils/activity');

const normalizeDateTime = (date) => {
    if (!date) return date;

    return new Date(date).toISOString();
};

const meetingService = {
    // Search for meeting that created and invited by the specific user
    async getAllMeetings(userId) {
        const meetings = await prisma.meeting.findMany({
            include: {
				space: {
                    select: { spaceName: true }
                },
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
				space: {
                    select: { spaceName: true }
                },
                participants: {
                    select: {
                        userId: true,
                        role: true,
                        attendance: true,
                        user: {
                            select: {
                                userName: true,
                                userEmail: true
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
				space: {
                    select: { spaceName: true }
                },
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
				space: {
                    select: { spaceName: true }
                },
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
            meetEnd
        } = meetingData;

        const normalizedStart = normalizeDateTime(meetStart);
        const normalizedEnd = normalizeDateTime(meetEnd);

        // Validate meeting time
        await validateMeetingTime({
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        });

        // Validate creator has no meeting conflict
        await validateParticipantConflicts({
            userId,
            participantIds: [userId],
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        });

        const meeting = await prisma.$transaction(async (tx) => {
        const newMeeting = await tx.meeting.create({
            data: {
                workspace: { connect: { workspaceId } },
                space: { connect: { spaceId } },
                createdBy: { connect: { userId } },
                meetTitle,
                meetDesc,
                meetStart: normalizedStart,
                meetEnd: normalizedEnd
            },
            include: {
                space: {
                    select: { spaceName: true }
                }
            }
        });

        await tx.meetingParticipant.create({
            data: {
                meetId: newMeeting.meetId,
                userId,
                role: MeetingRole.organiser,
                attendance: AttendanceStatus.present
            }
        });

        return newMeeting;
    });

    await logMeetingActivity({
        workspaceId,
        userId,
        action: 'scheduled a meeting',
        contextTitle: meeting.meetTitle,
        spaceName: meeting.space?.spaceName || 'Unknown Space',
        date: normalizedStart
    });

    return meeting;
    },

    // Update
    async updateMeeting(meetId, userId, data) {
        const {
            meetTitle,
            meetDesc,
            meetStart,
            meetEnd
        } = data;

        const normalizedStart = normalizeDateTime(meetStart);
        const normalizedEnd = normalizeDateTime(meetEnd);

        const meeting = await prisma.meeting.findUnique({
            where: { meetId },
            include: {
                space: {
                    select: { spaceName: true }
                }
            }
        });

        if (!meeting) 
            throw new Error("Meeting not found");

        if (meeting.createdByUserId !== userId)
            throw new Error('Unauthorized to update this meeting');

        // Validate time if changed
        await validateMeetingTime({
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        });

        // Update meeting
		const updatedMeeting = await prisma.meeting.update({
        where: { meetId },
        data: {
            meetTitle,
            meetDesc,
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        }
		});

		await logMeetingActivity({
			workspaceId: meeting.workspaceId,
			userId,
			action: 'updated a meeting',
			contextTitle: updatedMeeting.meetTitle,
			spaceName: meeting.space?.spaceName || 'Unknown Space',
			date: normalizedStart
		});

	    return updatedMeeting;
    },

    // Sync Participants
    async syncParticipants(meetId, userId, participantDatas) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

        if (!meeting) {
            throw new Error("Meeting not found");
        }

        if (meeting.createdByUserId !== userId) {
            throw new Error("Unauthorized to update this meeting");
        }

        // Ensure creator always exists and is organiser
        const creator = {
            userId: meeting.createdByUserId,
            role: MeetingRole.organiser,
            attendance: AttendanceStatus.present
        };

        const otherParticipants = participantDatas.filter(
            p => p.userId !== meeting.createdByUserId
        );

        const participants = [
            creator,
            ...otherParticipants
        ];

        const normalizedStart = normalizeDateTime(meeting.meetStart);
        const normalizedEnd = normalizeDateTime(meeting.meetEnd);

        // Validate participant conflicts
        await validateParticipantConflicts({
            userId,
            participantIds: participants.map(p => p.userId),
            meetStart: normalizedStart,
            meetEnd: normalizedEnd,
            excludeMeetId: meetId
        });

        return prisma.$transaction(async (tx) => {

            // Remove all current participants except organiser
            await tx.meetingParticipant.deleteMany({
                where: {
                    meetId,
                    userId: {
                        not: meeting.createdByUserId
                    }
                }
            });

            // Add participants except creator
            return tx.meetingParticipant.createMany({
                data: participants
                    .filter(
                        p => p.userId !== meeting.createdByUserId
                    )
                    .map(p => ({
                        meetId,
                        userId: p.userId,
                        role: p.role ?? MeetingRole.participant,
                        attendance: p.attendance ?? AttendanceStatus.pending
                    }))
            });
        });
    },

    // Delete 
    async deleteMeeting(meetId, userId) {
		const meeting = await prisma.meeting.findUnique({
			where: { meetId },
			include: { space: { select: { spaceName: true } } }
		});
		if (!meeting) 
			throw new Error('Meeting not found');

		if (meeting.createdByUserId !== userId) 
			throw new Error('Unauthorized to delete this meeting');

		await prisma.meetingParticipant.deleteMany({ where: { meetId } });
		await prisma.meeting.delete({ where: { meetId } });

		await logMeetingActivity({
			workspaceId: meeting.workspaceId,
			userId,
			action: 'cancelled a meeting',
			contextTitle: meeting.meetTitle,
			spaceName: meeting.space?.spaceName || 'Unknown Space',
			date: meeting.meetStart,
		});
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
    },

    async startMeeting(meetId, userId) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

        if (!meeting) {
            throw new Error('Meeting not found');
        }

        if (meeting.createdByUserId !== userId) {
            throw new Error('Unauthorized to start this meeting');
        }

        return prisma.meeting.update({
            where: { meetId },
            data: { status: 'started' }
        });
    }, 

    async endMeeting(meetId, userId) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });
        
        if (!meeting) {
            throw new Error('Meeting not found');
        }

        if (meeting.createdByUserId !== userId) {
            throw new Error('Unauthorized to end this meeting');
        }

        return prisma.meeting.update({
            where: { meetId },
            data: { status: 'scheduled' }
        });
    }
}

module.exports = meetingService;