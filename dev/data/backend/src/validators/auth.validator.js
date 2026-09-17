const { isNonEmptyString, isValidEmail } = require('./common.validator');

// Validate email/password login payload
function validateLogin({ userEmail, userPassword }) {
    if (!isNonEmptyString(userEmail) || !isNonEmptyString(userPassword)) {
        throw new Error('Email and password are required');
    }

    if (!isValidEmail(userEmail)) {
        throw new Error('Invalid email format');
    }

    if (userPassword.length < 8 || userPassword.length > 128) {
        throw new Error('Password must be between 8 to 128 characters');
    }

    // only trim, no lowercase since prisma finds EXACT match
	// usually google/outlook ignore capitalization in email add
    return {
        userEmail: userEmail.trim(),
        userPassword
    };
}

// Validate Google OAuth login payload
function validateGoogleLogin({ idToken }) {
    if (!isNonEmptyString(idToken)) {
        throw new Error('Google ID token is required');
    }

    // Google ID tokens are JWTs — reject anything absurd before we hand it to google-auth-library
    if (idToken.length > 4000) {
        throw new Error('Invalid Google ID token');
    }

    return { idToken };
}

module.exports = {
    validateLogin,
    validateGoogleLogin
};