// upload to supabase
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const { uploadFile } = require('../services/supabase-storage.service');
const prisma = require('../../prisma/client');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/avatar/:id', authMiddleware, requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.params.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${userId}/${fileName}`;

        const publicUrl = await uploadFile(
            process.env.SUPABASE_PUBLIC_BUCKET,
            filePath,
            req.file.buffer,
            req.file.mimetype
        );

        const user = await prisma.user.update({
            where: { userId },
            data: { avatarUrl: publicUrl }
        });

        res.json({
            success: true,
            avatarUrl: publicUrl,
            user: {
                userId: user.userId,
                userName: user.userName,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        console.error('Admin upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.userId;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${userId}/${fileName}`;
        
        // Upload to Supabase
        const publicUrl = await uploadFile(
            process.env.SUPABASE_PUBLIC_BUCKET,
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

