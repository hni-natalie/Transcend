const { validate: isUUID, version: uuidVersion } = require('uuid');

// CONST
// checks for basic email shape
// some char, an @, a dot(.), not whitespace or extra @ allowed
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TITLE_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 500;

// BASE VALIDATION
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
    return isNonEmptyString(value) && EMAIL_REGEX.test(value.trim()) && value.trim().length <= 255;
}

function isValidId(value) {
    if (!isNonEmptyString(value)) return false;
    const trimmed = value.trim();
    return isUUID(trimmed) && uuidVersion(trimmed) === 4;
}

function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
}

// TEXT VALIDATION
// Rejects input containing XSS patterns (script tags, event handlers, etc.)
// Fails explicitly so the caller knows why the input was rejected.
function containsSuspiciousMarkup(value) {
    if (typeof value !== 'string') return false;
    return /<\s*script|<\s*\/?\s*[a-z]|javascript:|on\w+\s*=/i.test(value);
}

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

    return value.trim();
}

// ENUM VALIDATION
function validateOption(value, validOptions, fieldName) {
    // If value is undefined/null, skip (for optional fields)
    if (!hasValue(value)) return;

    if (!validOptions.includes(value)) {
        throw new Error(`Invalid ${fieldName}`);
    }
}

// ID VALIDATION
function validateId(value, fieldName, required = true) {
    if (!hasValue(value)) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return;
    }

    if (!isValidId(value)) {
        throw new Error(`Invalid ${fieldName} format`);
    }
}

function validateUserIds(userIds, required = false) {
    if (!hasValue(userIds)) {
        if (required) {
            throw new Error('Invalid assigned user IDs');
        }
        return;
    }

    if (!Array.isArray(userIds) || userIds.some(id => !isValidId(id))) {
        throw new Error('Invalid assigned user IDs');
    }
}

// DATE VALIDATION
function validateDate(date, fieldName, required = true) {
    if (!hasValue(date)) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return;
    }

    if (isNaN(Date.parse(date))) {
        throw new Error(`Invalid ${fieldName} format`);
    }
}

module.exports = {
    EMAIL_REGEX,
	TITLE_MAX_LENGTH,
	DESC_MAX_LENGTH,
	hasValue,
    isNonEmptyString,
    isValidEmail,
    isValidId,
    containsSuspiciousMarkup,
	validateText,
	validateOption,
	validateId,
	validateUserIds,
	validateDate
};