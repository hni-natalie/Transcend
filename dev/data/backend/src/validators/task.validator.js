const {
	isNonEmptyString,
	isValidId,
	containsSuspiciousMarkup
} = require('./common.validator');

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


// Check whether an optional field was actually provided
const hasValue = value =>
	value !== undefined &&
	value !== null &&
	value !== '';


// Validate text fields such as title and description
function validateText(value, fieldName, maxLength) {
	if (!hasValue(value)) return;

	if (typeof value !== 'string') {
		throw new Error(`${fieldName} must be a string`);
	}

	if (containsSuspiciousMarkup(value)) {
		throw new Error(`${fieldName} contains characters that are not allowed`);
	}

	if (value.length > maxLength) {
		throw new Error(`${fieldName} must be under ${maxLength} characters`);
	}
}


// Validate enum-like fields
function validateOption(value, validOptions, fieldName) {
	if (hasValue(value) && !validOptions.includes(value)) {
		throw new Error(`Invalid ${fieldName}`);
	}
}


// Validate user ID arrays
function validateUserIds(userIds, required = false) {
	if (!hasValue(userIds)) {
		if (required) {
			throw new Error('Invalid assigned user IDs');
		}

		return;
	}

	if (
		!Array.isArray(userIds) ||
		userIds.some(id => !isValidId(id))
	) {
		throw new Error('Invalid assigned user IDs');
	}
}


function validateDate(date) {
	if (hasValue(date) && isNaN(Date.parse(date))) {
		throw new Error('Invalid due date format');
	}
}


function validateCreateTask({
	title,
	priority,
	desc,
	date,
	userIds
}) {
	if (!isNonEmptyString(title)) {
		throw new Error('Task title is required');
	}

	validateText(title, 'Task title', TITLE_MAX_LENGTH);

	if (!isNonEmptyString(priority)) {
		throw new Error('Task priority is required');
	}

	validateOption(
		priority,
		VALID_TASK_PRIORITY,
		'task priority'
	);

	validateText(
		desc,
		'Task description',
		DESC_MAX_LENGTH
	);

	validateDate(date);

	validateUserIds(userIds, true);

	return {
		taskTitle: title,
		taskPriority: priority,
		taskDesc: desc,
		dueDate: date,
		assignedUserIds: userIds,
	};
}


function validateUpdateTask({
	title,
	priority,
	desc,
	date,
	status,
	assignedUserIds
}) {
	validateText(
		title,
		'Task title',
		TITLE_MAX_LENGTH
	);

	validateOption(
		priority,
		VALID_TASK_PRIORITY,
		'task priority'
	);

	validateText(
		desc,
		'Task description',
		DESC_MAX_LENGTH
	);

	validateDate(date);

	validateOption(
		status,
		VALID_TASK_STATUS,
		'task status'
	);

	validateUserIds(assignedUserIds);

	return {
		taskTitle: title,
		taskPriority: priority,
		taskDesc: desc,
		dueDate: date,
		taskStatus: status,
		assignedUserIds,
	};
}


module.exports = {
	validateCreateTask,
	validateUpdateTask
};