const prisma = require('../../prisma/client');
const { MeetingRole, AttendanceStatus } = require('@prisma/client');
const { validateMeetingExists, validateMeetingAuthorization, validateMeetingRules, validateMeetingTime, validateParticipantConflicts, validateMeetingParticipant } = require('../validators/meeting.validator');
const { logMeetingActivity } = require('../utils/activity');

const ATTENDANCE_MIN_DURATION_MS = 5 * 60 * 1000;

const normalizeDateTime = (date) => {
    if (!date) return date;

    return new Date(date).toISOString();
};

const meetingService = {
    async getMeetingById(meetingId, userId) {
        return prisma.meeting.findFirst({
            where: {
                meetId: meetingId,
                OR: [
                    {
                        createdByUserId: userId
                    },
                    {
                        participants: {
                            some: {
                                userId
                            }
                        }
                    }
                ]
            },
            include: {
                space: {
                    select: { spaceName: true }
                },
                participants: {
                    select: {
                        userId: true,
                        role: true,
                        attendance: true,
                        meetingJoinAt: true,
                        meetingLeaveAt: true,
                        user: {
                            select: {
                                userName: true,
                                userEmail: true,
                                deletedAt: true
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

	// ids allowed to see updates
    async getMeetingAudienceIds(meetId) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId },
            select: {
                createdByUserId: true,
                participants: { select: { userId: true } }
            }
        });

        if (!meeting) return [];

        return [...new Set([
            meeting.createdByUserId,
            ...meeting.participants.map(({ userId }) => userId)
        ])];
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
			participantIds
        } = meetingData;

        validateMeetingRules({ workspaceId, spaceId, userId });

        const normalizedStart = normalizeDateTime(meetStart);
        const normalizedEnd = normalizeDateTime(meetEnd);

        // Validate meeting time
        validateMeetingTime({
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        });

		// Validate participant conflicts
		const allParticipantIds = [ ...new Set([userId, ...(participantIds || [])]) ];

		await validateParticipantConflicts({
			userId,
			participantIds: allParticipantIds,
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

            // get participants id and remove dups(by new Set), remove creator
            const inviteeIds = [...new Set(participantIds || [])]
                .filter((participantId) => participantId !== userId);

			// if more than creator, add to meeting, set attendance as pending
            if (inviteeIds.length > 0) {
                await tx.meetingParticipant.createMany({
                    data: inviteeIds.map((participantId) => ({
                        meetId: newMeeting.meetId,
                        userId: participantId,
                        role: MeetingRole.participant,
                        attendance: AttendanceStatus.pending
                    }))
                });
            }

            return newMeeting;
        });

        await logMeetingActivity({
            workspaceId,
            userId,
            action: 'scheduled a meeting',
            contextTitle: meeting.meetTitle,
            spaceName: meeting.space?.spaceName || 'Meeting Room'
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

        const meeting = await prisma.meeting.findUnique({
            where: { meetId },
            include: {
                space: {
                    select: { spaceName: true }
                }
            }
        });

        validateMeetingExists(meeting);
        validateMeetingAuthorization(meeting, userId);

		const normalizedStart = normalizeDateTime(meetStart);
        const normalizedEnd = normalizeDateTime(meetEnd);
        const resetAttendanceTimes = meeting.meetStart < new Date();

        // Validate time if changed
        validateMeetingTime({
            meetStart: normalizedStart,
            meetEnd: normalizedEnd
        });

        // Update meeting
        const updatedMeeting = await prisma.$transaction(async (tx) => {
            const updateMeeting = await prisma.meeting.update({
            where: { meetId },
            data: {
                meetTitle,
                meetDesc,
                meetStart: normalizedStart,
                meetEnd: normalizedEnd
            }
            });
            if (resetAttendanceTimes) {
                await tx.meetingParticipant.updateMany({
                where: { meetId },
                data: {
                    meetingJoinAt: null,
                    meetingLeaveAt: null,
                },
                });
            }
            return updateMeeting;
        })

		await logMeetingActivity({
			workspaceId: meeting.workspaceId,
			userId,
			action: 'updated a meeting',
			contextTitle: updatedMeeting.meetTitle,
			spaceName: meeting.space?.spaceName || 'Meeting Room'
		});

	    return updatedMeeting;
    },

    // Sync Participants
    async syncParticipants(meetId, userId, participantDatas, meetStart = null, meetEnd = null) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

        validateMeetingExists(meeting);
        validateMeetingAuthorization(meeting, userId);

        // Ensure creator always exists and is organiser
        const creator = {
            userId: meeting.createdByUserId,
            role: MeetingRole.organiser,
            attendance: AttendanceStatus.present
        };

        const otherParticipants = participantDatas.filter( p => p.userId !== meeting.createdByUserId );

        const participants = [
            creator,
            ...otherParticipants
        ];

        const normalizedStart = normalizeDateTime(meetStart ?? meeting.meetStart);
        const normalizedEnd = normalizeDateTime(meetEnd ?? meeting.meetEnd);

        // Validate participant conflicts
        await validateParticipantConflicts({
            userId,
            participantIds: participants.map(p => p.userId),
            meetStart: normalizedStart,
            meetEnd: normalizedEnd,
            excludeMeetId: meetId
        });

        return prisma.$transaction(async (tx) => {

            const participantIds = participants.map(({ userId: participantId }) => participantId);

            // Only remove users no longer invited. Deleting and recreating every
            // participant would discard their latest attendance session.
            await tx.meetingParticipant.deleteMany({
                where: {
                    meetId,
                    userId: {
                        notIn: participantIds
                    }
                }
            });

            await Promise.all(participants.map((participant) => tx.meetingParticipant.upsert({
                where: {
                    meetId_userId: {
                        meetId,
                        userId: participant.userId
                    }
                },
                create: {
                    meetId,
                    userId: participant.userId,
                    role: participant.role ?? MeetingRole.participant,
                    attendance: participant.attendance ?? AttendanceStatus.pending
                },
                // Manual participant sync may change role/attendance, but must
                // preserve latest join/leave timestamps for retained users.
                update: {
                    role: participant.role ?? MeetingRole.participant,
                    attendance: participant.attendance ?? AttendanceStatus.pending
                }
            })));

            return tx.meetingParticipant.findMany({ where: { meetId } });
        });
    },

    async recordParticipantJoin(meetId, userId) {
        await validateMeetingParticipant(meetId, userId);

        return prisma.meetingParticipant.update({
            where: { meetId_userId: { meetId, userId } },
            data: {
                meetingJoinAt: new Date(),
                meetingLeaveAt: null
            }
        });
    },

    async recordParticipantLeave(meetId, userId) {
        await validateMeetingParticipant(meetId, userId);

        const participant = await prisma.meetingParticipant.findUnique({
            where: { meetId_userId: { meetId, userId } }
        });

        if (!participant?.meetingJoinAt) return participant;

        const meetingLeaveAt = new Date();
        const attendedLongEnough = meetingLeaveAt.getTime() - participant.meetingJoinAt.getTime()
            > ATTENDANCE_MIN_DURATION_MS;

        const isHost = participant.role?.toLowerCase() === 'organiser';

        const updated = await prisma.$transaction(async (tx) => {
            // Update the current participant
            const participant = await tx.meetingParticipant.update({
                where: { meetId_userId: { meetId, userId } },
                data: {
                meetingLeaveAt,
                ...(attendedLongEnough && { attendance: AttendanceStatus.present }),
                },
            });

            // If host, mark everyone who never joined as absent
            if (isHost) {
                await tx.meetingParticipant.updateMany({
                where: {
                    meetId,
                    meetingJoinAt: null,     // never joined
                    userId: { not: userId }, // skip self(host)
                },
                data: {
                    attendance: AttendanceStatus.absent,
                },
                });
            }

            return participant;
        });

        return updated;
    },

    // Delete 
    async deleteMeeting(meetId, userId) {
		const meeting = await prisma.meeting.findUnique({
			where: { meetId },
			include: { space: { select: { spaceName: true } } }
		});

        validateMeetingExists(meeting);
        validateMeetingAuthorization(meeting, userId);

		await prisma.meetingParticipant.deleteMany({ where: { meetId } });
		await prisma.meeting.delete({ where: { meetId } });

		await logMeetingActivity({
			workspaceId: meeting.workspaceId,
			userId,
			action: 'cancelled a meeting',
			contextTitle: meeting.meetTitle,
			spaceName: meeting.space?.spaceName || 'Meeting Room'
		});
	},

    async togglePin(meetId, userId) {
        // Ensure meeting exists
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

		validateMeetingExists(meeting);

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

		validateMeetingExists(meeting);
        validateMeetingAuthorization(meeting, userId);

        return prisma.meeting.update({
            where: { meetId },
            data: { status: 'started' }
        });
    }, 

    async endMeeting(meetId, userId) {
        const meeting = await prisma.meeting.findUnique({
            where: { meetId }
        });

		validateMeetingExists(meeting);
        validateMeetingAuthorization(meeting, userId);

        return prisma.meeting.update({
            where: { meetId },
            data: { status: 'scheduled' }
        });
    },

}

module.exports = meetingService;
