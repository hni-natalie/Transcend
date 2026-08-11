const prisma = require('../../prisma/client');

async function createActivityLog({ workspaceId, userId, type, action, contextTitle, contextDetails }) {
    try {
        const activity = await prisma.activity.create({
            data: { workspaceId, userId, type, action, contextTitle, contextDetails },
            include: {
                user: {
                    include: { role: true, department: true },
                },
            },
        });

        emitActivityCreated(workspaceId, activity);

        return activity;
    } catch (error) {
        console.error('[activity.service] createActivityLog failed:', error.message);
        return null;
    }
}

// const { getIO } = require('./socket.service'); lazy require (only load when needed)
// if socket fail, dont let db write fail
function emitActivityCreated(workspaceId, activity) {
    try {
        const { getIO } = require('./socket.service'); // lazy require
        const io = getIO();
        io.to('dashboard-viewers').emit('activity-created', {
            workspaceId,
            activity: formatActivity(activity),
        });
    } catch (error) {
        console.error('[activity.service] emitActivityCreated failed:', error.message);
    }
}

function formatActivity(activity) {
    const user = activity.user;
    return {
        id: activity.activityId,
        type: activity.type,
        time: formatTime(activity.createdAt),
        relativeTime: getRelativeTime(activity.createdAt),
        user: user?.userName || 'Unknown',
		avatarUrl: user?.avatarUrl || null,
        role: user?.role?.roleName || 'Unknown',
        department: user?.department?.dpName || 'Unknown',
        action: activity.action,
        contextTitle: activity.contextTitle ?? undefined,
        contextDetails: activity.contextDetails ?? undefined,
    };
}

// for user's dashboard
async function getPaginatedActivities({ filters, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
        prisma.activity.findMany({
            where: filters,
            include: {
                user: {
                    include: { role: true, department: true },
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.activity.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
        activities: activities.map(formatActivity),
        total,
        totalPages,
        hasMore: page < totalPages,
    };
}

// for admin's dashboard
async function getRecentActivities({ filters, limit = 3 }) {
    const activities = await prisma.activity.findMany({
        where: filters,
        include: {
            user: {
                include: { role: true, department: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return activities.map(formatActivity);
}

async function exportActivities({ filters, format = 'csv' }) {
    const activities = await prisma.activity.findMany({
        where: filters,
        include: {
            user: {
                include: { role: true, department: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
        return toCsv(activities);
    }

    return activities.map(formatActivity);
}

function toCsv(activities) {
    const header = ['Date', 'Time', 'User', 'Role', 'Department', 'Type', 'Action', 'Context Title', 'Context Details'];
    const rows = activities.map((a) => [
        formatDate(a.createdAt),
        formatTime(a.createdAt),
        a.user?.userName ?? '',
        a.user?.role?.roleName ?? '',
        a.user?.department?.dpName ?? '',
        a.type,
        a.action,
        a.contextTitle ?? '',
        a.contextDetails ?? '',
    ]);

    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

function formatDate(date) {
    return new Date(date).toISOString().slice(0, 10);
}

function formatTime(date) {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function getRelativeTime(date) {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return new Date(date).toLocaleDateString();
}

module.exports = {
    createActivityLog,
    getPaginatedActivities,
    getRecentActivities,
    exportActivities,
};