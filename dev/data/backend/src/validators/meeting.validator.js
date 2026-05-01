const prisma = require('../../prisma/client');

async function validateMeeting({
    participantIds = [],
    meetStart,
    meetEnd,
    excludeMeetId = null
}) {

    // Validate required fields
    if (!meetStart || !meetEnd)
        throw new Error('Meeting start and end time are required');

    const start = new Date(meetStart);
    const end = new Date(meetEnd);

    // Validate date format
    if (isNaN(start) || isNaN(end))
        throw new Error('Invalid meeting date');

    // Validate time order
    if (start >= end)
        throw new Error('Meeting end time must be after start time');

    // Check participant conflicts
    if (participantIds) {
        const conflicts = await prisma.meetingParticipant.findMany({
            where: {
                userId: { in: participantIds },
    
                meet: {
                    // If excludeMeetId exist, ignore current meeting during update
                    ...(excludeMeetId && {
                        meetId: {
                            not: excludeMeetId
                        }
                    }),
    
                    // Overlapping logic
                    meetStart: { lt: end },
                    meetEnd: { gt: start }
                }
            },
            // Prisma automatically joins related tables
            include: { user: true, meet: true }
        });
    
        // If conflicts found
        if (conflicts.length > 0) {
            const conflictUsers = [ ...new Set(conflicts.map(c => c.user.userName || c.userId)) ];
            throw new Error(`Meeting conflict detected for: ${conflictUsers.join(', ')}`);
        }
    }
}

module.exports = { validateMeeting };