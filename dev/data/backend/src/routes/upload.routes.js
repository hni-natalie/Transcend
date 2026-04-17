// upload to supabase
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadFile } = require('../services/supabase-storage.service');
const prisma = require('../../prisma/client');

const upload = multer({ storage: multer.memoryStorage() });

router.put('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.userId;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `users/${userId}/${fileName}`;
        
        // Upload to Supabase
        const publicUrl = await uploadFile(
            process.env.SUPABASE_STORAGE_BUCKET,
            filePath,
            req.file.buffer,
            req.file.mimetype
        );
        
        // Store URL in database
        const user = await prisma.user.update({
            where: { userId: userId },
            data: { avatarUrl: publicUrl }
        });
        
        res.json({ 
            success: true, 
            avatarUrl: publicUrl,
            user: { userId: user.userId, userName: user.userName, avatarUrl: user.avatarUrl }
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

