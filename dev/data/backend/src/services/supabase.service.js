const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const secrets = require('../utils/secrets');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = secrets.SUPABASE_SERVICE_ROLE_KEY;

const cleanUrl = supabaseUrl?.trim().replace(/\/$/, '');

if (!cleanUrl || cleanUrl === 'undefined') {
    console.error('SUPABASE_URL is invalid!');
}

if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not defined in environment');
}
if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment');
}

const supabase = createClient(cleanUrl, supabaseKey, {
    auth: { persistSession: false }
});

const uploadFile = async (bucket, filePath, fileBuffer, contentType) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
};

const deleteFile = async (bucket, filePath) => {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;
};

module.exports = { supabase, uploadFile, deleteFile };
