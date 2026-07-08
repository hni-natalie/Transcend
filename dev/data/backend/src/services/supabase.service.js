/* 
supabase client with pub key
lower privilege than service role key, used for updating database
*/

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path:path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// clean the URL - remove any hidden characters, spaces, or newlines
const cleanUrl = supabaseUrl?.trim().replace(/\/$/, '');

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

module.exports = { supabase };