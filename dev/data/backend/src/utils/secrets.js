/*
 utility function to get docker secrets in backend
*/

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

module.exports = {
	// JWT
	JWT_SECRET: readSecret('jwt_secret'),
	// Users
	ROOT_PASSWORD: readSecret('app_root'),
	MOCK_PASSWORD: readSecret('app_mock'),
    // LiveKit
    LIVEKIT_API_KEY: readSecret('livekit_api_key'),
    LIVEKIT_API_SECRET: readSecret('livekit_api_secret'),
    LIVEKIT_URL: process.env.VITE_LIVEKIT_URL,
    // Supabase
	DATABASE_URL: readSecret('database_url'),
	DIRECT_URL: readSecret('direct_url'),
	SUPABASE_SERVICE_ROLE_KEY: readSecret('supabase_service_role_key'),
    SUPABASE_S3_ACCESS_KEY: readSecret('supabase_s3_access_key'),
    SUPABASE_S3_SECRET_KEY: readSecret('supabase_s3_secret_key'),
    SUPABASE_S3_ENDPOINT: process.env.SUPABASE_S3_ENDPOINT,
    SUPABASE_S3_BUCKET: process.env.SUPABASE_S3_BUCKET,
    SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION,
    SUPABASE_PUBLIC_URL: process.env.SUPABASE_PUBLIC_URL,
    // Google
	GOOGLE_CLIENT_SECRET: readSecret('google_client_secret'),
    GOOGLE_AI_API_KEY: readSecret('google_ai_api_key'),
	// SMTP
	SMTP_USER: readSecret('smtp_user'),
	SMTP_PASSWORD: readSecret('smtp_password'),
};