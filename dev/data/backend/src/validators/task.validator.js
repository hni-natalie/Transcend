const prisma = require('../../prisma/client');
const { isNonEmptyString, isValidEmail, isValidId, containsSuspiciousMarkup } = require('./common.validator');

const VALID_TASK_STATUS = [
	'not_started',
	'in_progress',
	'done'
];

const VALID_TASK_PRIORITY = [
	'low',
	'medium',
	'high'
];

const TITLE_MAX_LENGTH = 50;
const DESC_MAX_LENGTH = 200;

function validateCreateTask({title, priority, desc, date, userIds}) {

	if (!isNonEmptyString(title)) {
		throw new Error('Task title is required');
	}
	if (containsSuspiciousMarkup(title)) {
		throw new Error('Task title contains characters that are not allowed');
	}
	if (title.length > TITLE_MAX_LENGTH) {
		throw new Error(`Task title must be under ${TITLE_MAX_LENGTH} characters`);
	}

	if (!isNonEmptyString(priority)) {
		throw new Error('Task priority is required');
	}

	if (!VALID_TASK_PRIORITY.includes(priority)) {
		throw new Error('Invalid task priority');
	}

	if (desc !== undefined && desc !== null && desc !== '' && desc.length > DESC_MAX_LENGTH) {
		throw new Error(`Task description must be under ${DESC_MAX_LENGTH} characters`);
	}

	if (desc !== undefined && desc !== null && desc !== '' && containsSuspiciousMarkup(desc)) {
		throw new Error('Task description contains characters that are not allowed');
	}

	if (date !== undefined && date !== null && date !== '' && isNaN(Date.parse(date))) {
		throw new Error('Invalid due date format');
	}

	if (!Array.isArray(userIds) || userIds.some(id => !isValidId(id))) {
		throw new Error('Invalid assigned user IDs');
	}

	return {
		taskTitle: title,
		taskPriority: priority,
		taskDesc: desc,
		dueDate: date,
		assignedUserIds: userIds,
	};
}



function validateUpdateTask({title, priority, desc, date, status, assignedUserIds}) {
	
	if (title !== undefined && title !== null && title !== '' && containsSuspiciousMarkup(title)) {	
		throw new Error('Task title contains characters that are not allowed');
	}
	if (title !== undefined && title !== null && title !== '' && title.length > TITLE_MAX_LENGTH) {
		throw new Error(`Task title must be under ${TITLE_MAX_LENGTH} characters`);
	}

	if (priority !== undefined && priority !== null && priority !== '' && !VALID_TASK_PRIORITY.includes(priority)) {
		throw new Error('Invalid task priority');
	}

	if (desc !== undefined && desc !== null && desc !== '' && containsSuspiciousMarkup(desc)) {
		throw new Error('Task description contains characters that are not allowed');
	}
	if (desc !== undefined && desc !== null && desc !== '' && desc.length > DESC_MAX_LENGTH) {
		throw new Error(`Task description must be under ${DESC_MAX_LENGTH} characters`);
	}

	if (date !== undefined && date !== null && date !== '' && isNaN(Date.parse(date))) {
		throw new Error('Invalid due date format');
	}

	if (status !== undefined && status !== null && status !== '' && !VALID_TASK_STATUS.includes(status)) {
		throw new Error('Invalid task status');
	}

	if (assignedUserIds !== undefined && assignedUserIds !== null && assignedUserIds !== '' && (!Array.isArray(assignedUserIds) || assignedUserIds.some(id => !isValidId(id)))) {
		throw new Error('Invalid assigned user IDs');
	}

	return {
		taskTitle: title,
		taskPriority: priority,
		taskDesc: desc,
		dueDate: date,
		taskStatus: status,
		assignedUserIds: assignedUserIds,
	};
	
}

module.exports = {
	validateCreateTask,
	validateUpdateTask
};