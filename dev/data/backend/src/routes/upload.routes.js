// upload to supabase
import { uploadFile } from '../services/storage.js'

const publicUrl = await uploadFile(
    process.env.SUPABASE_STORAGE_BUCKET,
    `users/${userId}/${fileName}`,
    buffer,
    req.file.mimetype
)

// store publicUrl in database
await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: publicUrl }
})