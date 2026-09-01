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
function validateText(value, fieldName, maxLength, cannotBeEmpty = false) {
	if (value === undefined || value === null) return;

	if (typeof value !== 'string') {
		throw new Error(`${fieldName} must be a string`);
	}

	if (cannotBeEmpty && !isNonEmptyString(value)) {
		throw new Error(`${fieldName} cannot be empty`);
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
	taskTitle,
	taskPriority,
	taskDesc,
	dueDate,
	assignedUserIds
}) {
	if (!isNonEmptyString(taskTitle)) {
		throw new Error('Task title is required');
	}

	validateText(taskTitle, 'Task title', TITLE_MAX_LENGTH, true);

	if (!isNonEmptyString(taskPriority)) {
		throw new Error('Task priority is required');
	}

	validateOption(
		taskPriority,
		VALID_TASK_PRIORITY,
		'task priority'
	);

	validateText(
		taskDesc,
		'Task description',
		DESC_MAX_LENGTH
	);

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
	validateText(
		taskTitle,
		'Task title',
		TITLE_MAX_LENGTH,
		true
	);

	validateOption(
		taskPriority,
		VALID_TASK_PRIORITY,
		'task priority'
	);

	validateText(
		taskDesc,
		'Task description',
		DESC_MAX_LENGTH
	);

	validateDate(dueDate);

	validateOption(
		taskStatus,
		VALID_TASK_STATUS,
		'task status'
	);

	validateUserIds(assignedUserIds);

	return {
		taskTitle: taskTitle,
		taskPriority: taskPriority,
		taskDesc: taskDesc,
		dueDate: dueDate,
		taskStatus: taskStatus,
		assignedUserIds,
	};
}


module.exports = {
	validateCreateTask,
	validateUpdateTask,
};