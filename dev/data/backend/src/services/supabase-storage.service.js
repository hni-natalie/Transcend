const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// debug
// console.log('=== DEBUG SUPABASE URL ===');
// console.log('Raw value:', JSON.stringify(supabaseUrl));
// console.log('Length:', supabaseUrl?.length);
// console.log('Each character:', supabaseUrl?.split('').map(c => c.charCodeAt(0)));
// console.log('Has trailing slash?', supabaseUrl?.endsWith('/'));
// console.log('Has spaces?', supabaseUrl?.includes(' '));

// // temp - cmmt / del after test
// const supabaseUrl = 'https://apcmlotrgotgepyjbfgt.supabase.co';
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// console.log('HARDCODED URL:', supabaseUrl);

// clean the URL - remove any hidden characters, spaces, or newlines
const cleanUrl = supabaseUrl?.trim().replace(/\/$/, '');
// console.log('Cleaned URL:', cleanUrl);

if (!cleanUrl || cleanUrl === 'undefined') {
    console.error('SUPABASE_URL is invalid!');
}

// validate
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not defined in environment');
}
if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment');
}

// create client
const supabase = createClient(cleanUrl, supabaseKey, {
    auth: { persistSession: false }
});

const uploadFile = async (bucket, filePath, fileBuffer, contentType) => {
    console.log('Uploading to bucket:', bucket);
    console.log('File path:', filePath);
    console.log('Full Supabase URL:', cleanUrl);
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, { 
            contentType, 
            upsert: true 
        });
    
    if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
    }
    
    console.log('✅ Upload successful');
    
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    
    return publicUrl;
};

const deleteFile = async (bucket, filePath) => {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;
};

module.exports = { uploadFile, deleteFile };
