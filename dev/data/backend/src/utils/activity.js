const { createActivityLog } = require('../services/activity.service');

const formatDateTime = (date) => {
    if (!date) return 'Unknown Date';
    return `${new Date(date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    })} • ${new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    })}`;
};

const logMeetingActivity = async ({
    workspaceId,
    userId,
    action,
    contextTitle,
    spaceName,
    date,
    extraDetails = null
}) => {
    let contextDetails = `${spaceName || 'Unknown Space'} • ${formatDateTime(date)}`;
    
    if (extraDetails) {
        contextDetails = `${contextDetails} • ${extraDetails}`;
    }
    
    return createActivityLog({
        workspaceId,
        userId,
        type: 'meeting',
        action,
        contextTitle,
        contextDetails
    });
};

const logTaskActivity = async ({
    workspaceId,
    userId,
    action,
    contextTitle,
    details = null,
    priority = null
}) => {
    let contextDetails = details || '';
    
    if (priority) {
        contextDetails = contextDetails 
            ? `${contextDetails} • ${priority} Priority`
            : `${priority} Priority`;
    }
    
    return createActivityLog({
        workspaceId,
        userId,
        type: 'task',
        action,
        contextTitle,
        contextDetails: contextDetails || null
    });
};

const logSpaceActivity = async ({
    workspaceId,
    userId,
    action,
    spaceName,
    departmentName = null
}) => {
    return createActivityLog({
        workspaceId,
        userId,
        type: 'space',
        action,
        contextTitle: spaceName || 'Unknown Space',
        contextDetails: departmentName || 'General'
    });
};

const logPresenceActivity = async ({
    workspaceId,
    userId,
    action
}) => {
    return createActivityLog({
        workspaceId,
        userId,
        type: 'presence',
        action,
        contextTitle: null,
        contextDetails: null
    });
};

module.exports = {
    formatDateTime,
    logMeetingActivity,
    logTaskActivity,
    logSpaceActivity,
    logPresenceActivity
};