const { validate: isUUID, version: uuidVersion } = require('uuid');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Rejects input containing XSS patterns (script tags, event handlers, etc.)
// Fails explicitly so the caller knows why the input was rejected.
function containsSuspiciousMarkup(value) {
    if (typeof value !== 'string') return false;
    return /<\s*script|<\s*\/?\s*[a-z]|javascript:|on\w+\s*=/i.test(value);
}

module.exports = {
    EMAIL_REGEX,
    isNonEmptyString,
    isValidEmail,
    isValidId,
    containsSuspiciousMarkup
};