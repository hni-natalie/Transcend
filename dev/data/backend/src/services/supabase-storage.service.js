import { createClient } from '@supabase/supabase-js'

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