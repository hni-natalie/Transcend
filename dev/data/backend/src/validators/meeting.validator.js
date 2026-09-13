const prisma = require('../../prisma/client');
const {
    isNonEmptyString,
    isValidId,
    hasValue,
    containsSuspiciousMarkup,
    validateText,
    validateOption,
    validateId,
    validateDate,
    TITLE_MAX_LENGTH,
    DESC_MAX_LENGTH,
} = require('./common.validator');

const VALID_MEETING_STATUS = ['scheduled', 'started', 'completed', 'cancelled'];
const VALID_MEETING_ROLE = ['organiser', 'participant', 'viewer'];
const VALID_ATTENDANCE_STATUS = ['present', 'absent', 'pending'];

function validateMeetingTime({ meetStart, meetEnd }) { 
    if (!hasValue(meetStart) || !hasValue(meetEnd)) 
        throw new Error('Meeting start and end time are required');

    const start = new Date(meetStart);
    const end = new Date(meetEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
        throw new Error('Invalid meeting date');

    if (start >= end)
        throw new Error('Meeting end time must be after start time');

    return { start, end };
}

function validateParticipants(participants) {
    if (!hasValue(participants))
        return;

    if (!Array.isArray(participants))
        throw new Error('Participants must be an array');

    participants.forEach((p, index) => {
        if (!p.userId)
            throw new Error(`Participant at index ${index} missing userId`);

        if (!isValidId(p.userId))
            throw new Error(`Invalid userId at index ${index}`);

        if (p.role && !VALID_MEETING_ROLE.includes(p.role))
            throw new Error(`Invalid role at index ${index}. Must be organiser, participant, or viewer`);

        if (p.attendance && !VALID_ATTENDANCE_STATUS.includes(p.attendance))
            throw new Error(`Invalid attendance at index ${index}. Must be present, absent, or pending`);
    });
}

async function validateParticipantConflicts({ userId,
    participantIds = [],
    meetStart,
    meetEnd,
    excludeMeetId = null
}) {
    if (participantIds.length === 0) {
        return;
    }

    // const { start, end } = validateMeetingTime(meetStart, meetEnd);
	const { start, end } = validateMeetingTime({ meetStart, meetEnd });

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
                    if (c.user.userId === userId) {
                        return `(You) ${c.user.userName}`;
                    }
                    return c.user.userName || c.userId;
                })
            )
        ];

        throw new Error(
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
        throw new Error('Workspace ID is required');

    if (!isNonEmptyString(spaceId))
        throw new Error('Space ID is required');

    if (!isNonEmptyString(meetTitle))
        throw new Error('Meeting title is required');

    validateId(workspaceId, 'workspaceId');
    validateId(spaceId, 'spaceId');
    validateText(meetTitle, 'Meeting title', TITLE_MAX_LENGTH, true);
    validateText(meetDesc, 'Meeting description', DESC_MAX_LENGTH);
    validateDate(meetStart, 'meetStart');
    validateDate(meetEnd, 'meetEnd');
    validateMeetingTime({ meetStart, meetEnd });

	if (hasValue(participantIds)) {
        if (!Array.isArray(participantIds))
            throw new Error('Participant IDs must be an array');

        participantIds.forEach((id, index) => {
            if (!isValidId(id))
                throw new Error(`Invalid participant userId at index ${index}`);
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
        throw new Error('Meeting ID is required');

    validateId(meetId, 'meetId');
    validateText(meetTitle, 'Meeting title', TITLE_MAX_LENGTH, true);
    validateText(meetDesc, 'Meeting description', DESC_MAX_LENGTH);

    if (hasValue(meetStart))
        validateDate(meetStart, 'meetStart');

    if (hasValue(meetEnd))
        validateDate(meetEnd, 'meetEnd');

    if (hasValue(meetStart) && hasValue(meetEnd))
        validateMeetingTime({ meetStart, meetEnd });

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
        throw new Error('Meeting ID is required');

    validateId(meetId, 'meetId');
    validateParticipants(participants);

    if (hasValue(meetStart))
        validateDate(meetStart, 'meetStart');

    if (hasValue(meetEnd))
        validateDate(meetEnd, 'meetEnd');

    if (hasValue(meetStart) && hasValue(meetEnd))
        validateMeetingTime({ meetStart, meetEnd });

    return {
        meetId: meetId.trim(),
        participants: participants || [],
        meetStart,
        meetEnd
    };
}

function validateMeetingRules({
    meetId,
    userId,
    workspaceId,
    spaceId
}) {
    validateId(meetId, 'meetId', false);
    validateId(userId, 'userId');
    validateId(workspaceId, 'workspaceId');
    validateId(spaceId, 'spaceId');
}

function validateMeetingExists(meeting) {
    if (!meeting)
        throw new Error('Meeting not found');
}

function validateMeetingAuthorization(meeting, userId) {
    if (meeting.createdByUserId !== userId)
        throw new Error('Unauthorized to perform this action');
}

module.exports = {
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
    validateSyncParticipants
};
