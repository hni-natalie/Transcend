import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

const __filename = fileURLToPath(import.meta.url); // this gives pwd
const __dirname = path.dirname(__filename);
dotenv.config({ path:path.join(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,  // use SERVICE_ROLE for backend-only uploads
    {
        auth: { persistSession: false }     // no auth state needed yet
    }
)

export async function uploadFile(bucket, filePath, fileBuffer, contentType) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, { contentType })
    
    if (error) throw error
    
    // get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
    
    return publicUrl
}

export async function deleteFile(bucket, filePath) {
    const { error } = await supabase.storage.from(bucket).remove([filePath])
    if (error) throw error
}

export async function updateSocketId(socketId, userId, userStatus) {
    const { data, error } = await supabase
        .from('User')
        .update({ socketId:socketId, userStatus:userStatus })
        .eq('userId', userId)
    if (error) {
        console.error('Error updating socketId: ', error);
    } else {
        console.log(`Socket ID ${socketId} stored in db for user ${userId}`);
    }
}