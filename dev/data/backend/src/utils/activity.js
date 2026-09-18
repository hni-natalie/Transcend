const { createActivityLog } = require('../services/activity.service');

const logMeetingActivity = async ({
    workspaceId,
    userId,
    action,
    contextTitle,
    spaceName,
    extraDetails = null
}) => {
    let contextDetails = `${spaceName || 'Meeting Room'}`;
    
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
        contextDetails: departmentName || 'Common Space'
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
    logMeetingActivity,
    logTaskActivity,
    logSpaceActivity,
    logPresenceActivity
};