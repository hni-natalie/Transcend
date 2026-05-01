/*
 utility function to get docker secrets in backend
*/


// config/secrets.js
const fs     = require('fs');
const path   = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const SECRETS_PATH = '/run/secrets';

function readSecret(secretName) {
    try {
        const secretPath = path.join(SECRETS_PATH, secretName);
        const secretValue = fs.readFileSync(secretPath, 'utf8').trim();
        return secretValue;
    } catch (error) {
        console.error(`Failed to read secret ${secretName}:`, error.message);
        // Fallback to environment variable for development
        return process.env[secretName.toUpperCase()];
    }
}

// Export your LiveKit credentials
module.exports = {
    LIVEKIT_API_KEY: readSecret('livekit_api_key'),
    LIVEKIT_API_SECRET: readSecret('livekit_api_secret'),
    LIVEKIT_URL: process.env.VITE_LIVEKIT_URL,
};