const prisma = require('../../prisma/client');

// Validate meeting start & end time
function validateMeetingTime({
    meetStart,
    meetEnd
}) {
    if (!meetStart || !meetEnd) {
        throw new Error("Meeting start and end time are required");
    }

    const start = new Date(meetStart);
    const end = new Date(meetEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid meeting date");
    }

    if (start >= end) {
        throw new Error("Meeting end time must be after start time");
    }

    return {
        start,
        end
    };
}

// Validate participant schedule conflicts
async function validateParticipantConflicts({
    userId,
    participantIds = [],
    meetStart,
    meetEnd,
    excludeMeetId = null
}) {
    if (participantIds.length === 0) {
        return;
    }

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

function validateRequiredStrings(fields) {
    for (const [fieldName, value] of Object.entries(fields)) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`${fieldName} is required and cannot be empty`);
        }
    }
}

module.exports = {
    validateMeetingTime,
    validateParticipantConflicts,
    validateRequiredStrings
};