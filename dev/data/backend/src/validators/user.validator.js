const { validatePassword } = require('../utils/password');
const { 
	isNonEmptyString, 
	isValidEmail, 
	isValidId, 
	hasValue, 
	TITLE_MAX_LENGTH, 
	validateText, 
	validateOption, 
	validateId, 
	validateUserIds 
} = require('./common.validator');

const VALID_STATUSES = ['online', 'focus', 'in_meeting', 'away', 'offline'];
const NAME_MAX_LENGTH = 100;
const CITY_COUNTRY_MAX_LENGTH = 100;

function assertSafeText(value, fieldName, maxLength) {
    if (!hasValue(value)) return;
    validateText(value, fieldName, maxLength);
}

function validateCreateUser({ email, password, name, roleId, dpId, userTitle }) {
    if (!isNonEmptyString(email))
        throw new Error('Email is required');

    if (!isValidEmail(email))
        throw new Error('Invalid email format');

    if (!isNonEmptyString(name))
        throw new Error('Name is required');

    assertSafeText(name, 'Name', NAME_MAX_LENGTH);

    if (!isNonEmptyString(roleId) || !isValidId(roleId))
        throw new Error('A valid role is required');

    if (hasValue(dpId) && !isValidId(dpId))
        throw new Error('Invalid department');

    if (hasValue(userTitle))
        assertSafeText(userTitle, 'Title', TITLE_MAX_LENGTH);

    if (password) {
        const validation = validatePassword(password);
        if (!validation.isValid)
            throw new Error(validation.errors.join('. '));
    }

    return {
        email: email.trim().toLowerCase(),
        password: password || undefined,
        name: name.trim(),
        roleId: roleId.trim(),
        dpId: hasValue(dpId) ? dpId.trim() : undefined,
        userTitle: hasValue(userTitle) ? userTitle.trim() : undefined
    };
}

function validateUpdateUserByAdmin({ name, email, roleId, dpId, status, password, city, country, avatarUrl, userTitle }) {
    const result = {};

    if (hasValue(name)) {
        if (!isNonEmptyString(name)) 
            throw new Error('Name cannot be empty');
        assertSafeText(name, 'Name', NAME_MAX_LENGTH);
        result.name = name.trim();
    }

    if (hasValue(email)) {
        if (!isValidEmail(email))
            throw new Error('Invalid email format');
        result.email = email.trim().toLowerCase();
    }

    if (hasValue(roleId)) {
        if (!isValidId(roleId))
            throw new Error('Invalid role');
        result.roleId = roleId.trim();
    }

    if (hasValue(dpId)) {
        if (!isValidId(dpId))
            throw new Error('Invalid department');
        result.dpId = dpId.trim();
	}

    if (hasValue(status)) {
        validateOption(status, VALID_STATUSES, 'status');
        result.status = status.trim();
    }

    if (hasValue(city)) {
        assertSafeText(city, 'City', CITY_COUNTRY_MAX_LENGTH);
        result.city = city.trim();
    }

    if (hasValue(country)) {
        assertSafeText(country, 'Country', CITY_COUNTRY_MAX_LENGTH);
        result.country = country.trim();
    }

    if (hasValue(userTitle)) {
        assertSafeText(userTitle, 'Title', TITLE_MAX_LENGTH);
        result.userTitle = userTitle.trim();
    }

    if (hasValue(avatarUrl)) {
        if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048) {
            throw new Error('Invalid avatar URL');
        }
        result.avatarUrl = avatarUrl;
    }

    if (password) {
        const validation = validatePassword(password);
        if (!validation.isValid)
            throw new Error(validation.errors.join('. '));
        result.password = password;
    }

    return result;
}

function validateUpdateProfile({ userName, userEmail, city, country, timezone }) {
    const result = {};

    if (hasValue(userName)) {
        if (!isNonEmptyString(userName))
            throw new Error('Name cannot be empty');
        assertSafeText(userName, 'Name', NAME_MAX_LENGTH);
        result.userName = userName.trim();
    }

    if (hasValue(userEmail)) {
        if (!isValidEmail(userEmail))
            throw new Error('Invalid email format');
        result.userEmail = userEmail.trim().toLowerCase();
    }

    if (hasValue(city)) {
        assertSafeText(city, 'City', CITY_COUNTRY_MAX_LENGTH);
        result.city = city.trim();
    }

    if (hasValue(country)) {
        assertSafeText(country, 'Country', CITY_COUNTRY_MAX_LENGTH);
        result.country = country.trim();
    }

    if (hasValue(timezone)) {
        if (typeof timezone !== 'string' || timezone.length > 100)
            throw new Error('Invalid timezone');
        result.timezone = timezone.trim();
    }

    return result;
}

function validateUserStatus({ status }) {
    if (!isNonEmptyString(status))
        throw new Error('Status is required');
    validateOption(status, VALID_STATUSES, 'status');
    return { status: status.trim() };
}

function validateChangePassword({ oldPassword, newPassword }) {
    if (!isNonEmptyString(oldPassword) || !isNonEmptyString(newPassword))
        throw new Error('Both old password and new password are required');

    const validation = validatePassword(newPassword);
    if (!validation.isValid)
        throw new Error(validation.errors.join('. '));

    return { oldPassword, newPassword };
}

function validateResetPassword({ newPassword }) {
    if (!isNonEmptyString(newPassword))
        throw new Error('New password is required');

    const validation = validatePassword(newPassword);
    if (!validation.isValid)
        throw new Error(validation.errors.join('. '));

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