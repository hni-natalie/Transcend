const {
    isNonEmptyString,
    hasValue,
    validateText,
    validateOption,
    validateDate,
    validateUserIds,
    TITLE_MAX_LENGTH,
    DESC_MAX_LENGTH,
} = require('./common.validator');

const VALID_TASK_STATUS = ['not_started', 'in_progress', 'done'];
const VALID_TASK_PRIORITY = [ 'low', 'medium', 'high'];

function validateCreateTask({ 
	taskTitle,
	taskPriority,
	taskDesc,
	dueDate,
	assignedUserIds 
}) {
    if (!isNonEmptyString(taskTitle))
        throw new Error('Task title is required');

    validateText(taskTitle, 'Task title', TITLE_MAX_LENGTH, true);

    if (!isNonEmptyString(taskPriority))
        throw new Error('Task priority is required');

    validateOption(taskPriority, VALID_TASK_PRIORITY, 'task priority');
    validateText(taskDesc, 'Task description', DESC_MAX_LENGTH);
    validateDate(dueDate);
    validateUserIds(assignedUserIds, true);

    return {
        taskTitle: taskTitle,
        taskPriority: taskPriority,
        taskDesc: taskDesc,
        dueDate: dueDate,
        assignedUserIds: assignedUserIds,
    };
}

function validateUpdateTask({
	taskTitle,
	taskPriority,
	taskDesc,
	dueDate,
	taskStatus,
	assignedUserIds
}) {
    if (hasValue(taskTitle))
        validateText(taskTitle, 'Task title', TITLE_MAX_LENGTH, true);

    if (hasValue(taskPriority))
        validateOption(taskPriority, VALID_TASK_PRIORITY, 'task priority');

    if (hasValue(taskDesc))
        validateText(taskDesc, 'Task description', DESC_MAX_LENGTH);

    if (hasValue(dueDate))
        validateDate(dueDate);

    if (hasValue(taskStatus))
        validateOption(taskStatus, VALID_TASK_STATUS, 'task status');

    if (hasValue(assignedUserIds))
        validateUserIds(assignedUserIds);

    const result = {};
    if (hasValue(taskTitle)) result.taskTitle = taskTitle;
    if (hasValue(taskPriority)) result.taskPriority = taskPriority;
    if (hasValue(taskDesc)) result.taskDesc = taskDesc;
    if (hasValue(dueDate)) result.dueDate = dueDate;
    if (hasValue(taskStatus)) result.taskStatus = taskStatus;
    if (hasValue(assignedUserIds)) result.assignedUserIds = assignedUserIds;

    return result;
}

module.exports = {
    validateCreateTask,
    validateUpdateTask,
};
