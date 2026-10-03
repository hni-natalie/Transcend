const prisma = require('../../prisma/client');

const {
    isNonEmptyString,
    isValidId,
    hasValue,
    validateText,
    validateId,
    validateDate,
    TITLE_MAX_LENGTH,
    DESC_MAX_LENGTH,
} = require('./common.validator');

class ValidatorError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'ValidatorError';
        this.statusCode = statusCode;
    }
}

class AuthorizationError extends ValidatorError {
    constructor(message = 'Unauthorized to perform this action') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

const VALID_MEETING_STATUS = ['scheduled', 'started', 'completed', 'cancelled'];
const VALID_MEETING_ROLE = ['organiser', 'participant', 'viewer'];
const VALID_ATTENDANCE_STATUS = ['present', 'absent', 'pending'];

function validateMeetingTime({ meetStart, meetEnd }) {
    if (!hasValue(meetStart) || !hasValue(meetEnd))
        throw new ValidatorError('Meeting start and end time are required');

    const start = new Date(meetStart);
    const end = new Date(meetEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
        throw new ValidatorError('Invalid meeting date');

    if (start >= end)
        throw new ValidatorError('Meeting end time must be after start time');

    return { start, end };
}

function validateParticipants(participants) {
    if (!hasValue(participants))
        return;

    if (!Array.isArray(participants))
        throw new ValidatorError('Participants must be an array');

    participants.forEach((p, index) => {
        if (!p.userId)
            throw new ValidatorError(
                `Participant at index ${index} missing userId`
            );

        if (!isValidId(p.userId))
            throw new ValidatorError(
                `Invalid userId at index ${index}`
            );

        if (p.role && !VALID_MEETING_ROLE.includes(p.role))
            throw new ValidatorError(
                `Invalid role at index ${index}. Must be organiser, participant, or viewer`
            );

        if (p.attendance && !VALID_ATTENDANCE_STATUS.includes(p.attendance))
            throw new ValidatorError(
                `Invalid attendance at index ${index}. Must be present, absent, or pending`
            );
    });
}

async function validateParticipantConflicts({
    userId,
    participantIds = [],
    meetStart,
    meetEnd,
    excludeMeetId = null
}) {
    if (participantIds.length === 0)
        return;

    const { start, end } = validateMeetingTime({
        meetStart,
        meetEnd
    });

    const conflicts = await prisma.meetingParticipant.findMany({
        where: {
            userId: {
                in: participantIds
            },
            meet: {
                ...(excludeMeetId && {
                    meetId: {
                        not: excludeMeetId
                    }
                }),
                meetStart: {
                    lt: end
                },
                meetEnd: {
                    gt: start
                }
            }
        },
        include: {
            user: true,
            meet: true
        }
    });

    if (conflicts.length > 0) {
        const conflictUsers = [
            ...new Set(
                conflicts.map(c => {
                    if (c.user.userId === userId)
                        return `(You) ${c.user.userName}`;

                    return c.user.userName || c.userId;
                })
            )
        ];

        throw new ValidatorError(
            `Meeting conflict detected for: ${conflictUsers.join(", ")}`
        );
    }
}

function validateCreateMeeting({
    workspaceId,
    spaceId,
    meetTitle,
    meetDesc,
    meetStart,
    meetEnd,
    participantIds
}) {
    if (!isNonEmptyString(workspaceId))
        throw new ValidatorError('Workspace ID is required');

    if (!isNonEmptyString(spaceId))
        throw new ValidatorError('Space ID is required');

    if (!isNonEmptyString(meetTitle))
        throw new ValidatorError('Meeting title is required');

    validateId(workspaceId, 'workspaceId');
    validateId(spaceId, 'spaceId');
    validateText(meetTitle, 'Meeting title', TITLE_MAX_LENGTH, true);
    validateText(meetDesc, 'Meeting description', DESC_MAX_LENGTH);
    validateDate(meetStart, 'meetStart');
    validateDate(meetEnd, 'meetEnd');

    validateMeetingTime({
        meetStart,
        meetEnd
    });

    if (hasValue(participantIds)) {
        if (!Array.isArray(participantIds))
            throw new ValidatorError('Participant IDs must be an array');

        participantIds.forEach((id, index) => {
            if (!isValidId(id))
                throw new ValidatorError(
                    `Invalid participant userId at index ${index}`
                );
        });
    }

    return {
        workspaceId: workspaceId.trim(),
        spaceId: spaceId.trim(),
        meetTitle: meetTitle.trim(),
        meetDesc: hasValue(meetDesc) ? meetDesc.trim() : '',
        meetStart,
        meetEnd,
        participantIds: participantIds || []
    };
}

function validateUpdateMeeting({
    meetId,
    meetTitle,
    meetDesc,
    meetStart,
    meetEnd
}) {
    if (!isNonEmptyString(meetId))
        throw new ValidatorError('Meeting ID is required');

    validateId(meetId, 'meetId');
    validateText(meetTitle, 'Meeting title', TITLE_MAX_LENGTH, true);
    validateText(meetDesc, 'Meeting description', DESC_MAX_LENGTH);

    if (hasValue(meetStart))
        validateDate(meetStart, 'meetStart');

    if (hasValue(meetEnd))
        validateDate(meetEnd, 'meetEnd');

    if (hasValue(meetStart) && hasValue(meetEnd)) {
        validateMeetingTime({
            meetStart,
            meetEnd
        });
    }

    return {
        meetId: meetId.trim(),
        meetTitle: meetTitle ? meetTitle.trim() : undefined,
        meetDesc: meetDesc ? meetDesc.trim() : undefined,
        meetStart,
        meetEnd
    };
}

function validateSyncParticipants({
    meetId,
    participants,
    meetStart,
    meetEnd
}) {
    if (!isNonEmptyString(meetId))
        throw new ValidatorError('Meeting ID is required');

    validateId(meetId, 'meetId');
    validateParticipants(participants);

    if (hasValue(meetStart))
        validateDate(meetStart, 'meetStart');

    if (hasValue(meetEnd))
        validateDate(meetEnd, 'meetEnd');

    if (hasValue(meetStart) && hasValue(meetEnd)) {
        validateMeetingTime({
            meetStart,
            meetEnd
        });
    }

    return {
        meetId: meetId.trim(),
        participants: participants || [],
        meetStart,
        meetEnd
    };
}

async function validateMeetingRules({
    meetId,
    userId,
    workspaceId,
    spaceId
}) {
    validateId(meetId, 'meetId', false);
    validateId(userId, 'userId');
    validateId(workspaceId, 'workspaceId');
    validateId(spaceId, 'spaceId');

    await validateMeetingCountPerDay(userId);
}

async function validateMeetingCountPerDay(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.meeting.count({
        where: {
            createdByUserId: userId,
            createdAt: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    if (count >= 10) {
        throw new ValidatorError(
            `You've reached the daily limit of meetings scheduled in a day.`
        );
    }
}

function validateMeetingExists(meeting) {
    if (!meeting)
        throw new ValidatorError('Meeting not found', 404);
}

function validateMeetingAuthorization(meeting, userId) {
    if (meeting.createdByUserId !== userId)
        throw new AuthorizationError();
}

async function validateMeetingParticipant(meetId, userId) {
    const meeting = await prisma.meeting.findFirst({
        where: {
            meetId,
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
        }
    });

    validateMeetingExists(meeting);

    return meeting;
}

function validateMeetingNotEnded(meeting) {
    if (meeting.meetEnd <= new Date()) {
        throw new ValidatorError(
            'Cannot update a meeting that has already ended'
        );
    }
}

module.exports = {
    ValidatorError,
    AuthorizationError,

    VALID_MEETING_STATUS,
    VALID_MEETING_ROLE,
    VALID_ATTENDANCE_STATUS,

    validateMeetingTime,
    validateParticipants,
    validateParticipantConflicts,
    validateMeetingRules,
    validateMeetingExists,
    validateMeetingAuthorization,
    validateCreateMeeting,
    validateUpdateMeeting,
    validateSyncParticipants,
    validateMeetingParticipant,
    validateMeetingNotEnded
};