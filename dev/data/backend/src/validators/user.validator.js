const { isNonEmptyString, isValidEmail, isValidId, containsSuspiciousMarkup } = require('./common.validator');
const { validatePassword } = require('../utils/password');

const VALID_STATUSES = ['online', 'focus', 'in_meeting', 'away', 'offline'];
const NAME_MAX_LENGTH = 100;
const TITLE_MAX_LENGTH = 50;
const CITY_COUNTRY_MAX_LENGTH = 100;

function assertSafeText(value, fieldName, maxLength) {
    if (value === undefined || value === null) return;

    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be text`);
    }

    if (value.length > maxLength) {
        throw new Error(`${fieldName} must be under ${maxLength} characters`);
    }

    if (containsSuspiciousMarkup(value)) {
        throw new Error(`${fieldName} contains characters that are not allowed`);
    }
}

// Validate payload for admin creating a new user
function validateCreateUser({ email, password, name, roleId, dpId, userTitle }) {
    if (!isNonEmptyString(email)) {
        throw new Error('Email is required');
    }
    if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (!isNonEmptyString(name)) {
        throw new Error('Name is required');
    }
    assertSafeText(name, 'Name', NAME_MAX_LENGTH);

    if (!isNonEmptyString(roleId) || !isValidId(roleId)) {
        throw new Error('A valid role is required');
    }

    if (dpId !== undefined && dpId !== null && dpId !== '' && !isValidId(dpId)) {
        throw new Error('Invalid department');
    }

    if (userTitle !== undefined && userTitle !== null && userTitle !== '') {
        assertSafeText(userTitle, 'Title', TITLE_MAX_LENGTH);
    }

    // password is optional at creation (a temp password gets generated) — but if the
    // admin supplied one, it has to pass the real password rules
    if (password) {
        const validation = validatePassword(password);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }
    }

    return {
        email: email.trim().toLowerCase(),
        password: password || undefined,
        name: name.trim(),
        roleId: roleId.trim(),
        dpId: dpId ? dpId.trim() : undefined,
        userTitle: userTitle ? userTitle.trim() : undefined
    };
}

// Validate payload for admin updating an existing user
function validateUpdateUserByAdmin({ name, email, roleId, dpId, status, password, city, country, avatarUrl, userTitle }) {
    if (name !== undefined) {
        if (!isNonEmptyString(name)) {
            throw new Error('Name cannot be empty');
        }
        assertSafeText(name, 'Name', NAME_MAX_LENGTH);
    }

    if (email !== undefined) {
        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
    }

    if (roleId !== undefined && roleId !== null && (roleId === '' || !isValidId(roleId))) {
		throw new Error('Invalid role');
	}

    if (dpId !== undefined && dpId !== null && dpId !== '' && !isValidId(dpId)) {
        throw new Error('Invalid department');
    }

    if (status !== undefined && status !== null && status !== '' && !VALID_STATUSES.includes(status)) {
        throw new Error('Invalid status');
    }

    assertSafeText(city, 'City', CITY_COUNTRY_MAX_LENGTH);
    assertSafeText(country, 'Country', CITY_COUNTRY_MAX_LENGTH);
    assertSafeText(userTitle, 'Title', TITLE_MAX_LENGTH);

    if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '') {
        if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048) {
            throw new Error('Invalid avatar URL');
        }
    }

    if (password) {
        const validation = validatePassword(password);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }
    }

    return {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? email.trim().toLowerCase() : undefined,
        roleId, dpId, status, password, userTitle,
        city: city !== undefined ? city.trim() : undefined,
        country: country !== undefined ? country.trim() : undefined,
        avatarUrl
    };
}

// Validate payload for a user updating their own profile
function validateUpdateProfile({ userName, userEmail, city, country, timezone }) {
    if (userName !== undefined) {
        if (!isNonEmptyString(userName)) {
            throw new Error('Name cannot be empty');
        }
        assertSafeText(userName, 'Name', NAME_MAX_LENGTH);
    }

    if (userEmail !== undefined && !isValidEmail(userEmail)) {
        throw new Error('Invalid email format');
    }

    assertSafeText(city, 'City', CITY_COUNTRY_MAX_LENGTH);
    assertSafeText(country, 'Country', CITY_COUNTRY_MAX_LENGTH);

    if (timezone !== undefined && timezone !== null && timezone !== '') {
        if (typeof timezone !== 'string' || timezone.length > 100) {
            throw new Error('Invalid timezone');
        }
    }

    return {
        userName: userName !== undefined ? userName.trim() : undefined,
        userEmail: userEmail !== undefined ? userEmail.trim().toLowerCase() : undefined,
        city: city !== undefined ? city.trim() : undefined,
        country: country !== undefined ? country.trim() : undefined,
        timezone
    };
}

// Validate a user status update (self-service, e.g. away/focus toggle)
function validateUserStatus({ status }) {
    if (!isNonEmptyString(status)) {
        throw new Error('Status is required');
    }
    if (!VALID_STATUSES.includes(status)) {
        throw new Error('Invalid status');
    }
    return { status };
}

// Validate a self-service password change (requires old password)
function validateChangePassword({ oldPassword, newPassword }) {
    if (!isNonEmptyString(oldPassword) || !isNonEmptyString(newPassword)) {
        throw new Error('Both old password and new password are required');
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
    }

    return { oldPassword, newPassword };
}

// Validate an admin-triggered password reset (no old password needed)
function validateResetPassword({ newPassword }) {
    if (!isNonEmptyString(newPassword)) {
        throw new Error('New password is required');
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
    }

    return { newPassword };
}

module.exports = {
	VALID_STATUSES,
    validateCreateUser,
    validateUpdateUserByAdmin,
    validateUpdateProfile,
    validateUserStatus,
    validateChangePassword,
    validateResetPassword
};