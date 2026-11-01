const path = require('path');

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif'];
const ACCEPTED_ATTACHMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/gif'
];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_AVATAR_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const ACCEPTED_AVATAR_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
];

function checkMagicBytes(buffer, ext) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
        return false;
    }

    switch (ext.toLowerCase()) {
        case '.png':
            // PNG signature: 89 50 4E 47 0D 0A 1A 0A
            return (
                buffer.length >= 8 &&
                buffer[0] === 0x89 &&
                buffer[1] === 0x50 &&
                buffer[2] === 0x4E &&
                buffer[3] === 0x47 &&
                buffer[4] === 0x0D &&
                buffer[5] === 0x0A &&
                buffer[6] === 0x1A &&
                buffer[7] === 0x0A
            );

        case '.jpg':
        case '.jpeg':
            // JPEG signature: FF D8 FF
            return (
                buffer.length >= 3 &&
                buffer[0] === 0xFF &&
                buffer[1] === 0xD8 &&
                buffer[2] === 0xFF
            );

        case '.gif':
            // GIF87a or GIF89a: 47 49 46 38 (37|39) 61
            if (buffer.length < 6) return false;
            const gifHeader = buffer.subarray(0, 6).toString('ascii');
            return gifHeader === 'GIF87a' || gifHeader === 'GIF89a';

        case '.webp':
            // RIFF header (52 49 46 46) and WEBP marker (57 45 42 50) at offset 8
            return (
                buffer.length >= 12 &&
                buffer[0] === 0x52 &&
                buffer[1] === 0x49 &&
                buffer[2] === 0x46 &&
                buffer[3] === 0x46 &&
                buffer[8] === 0x57 &&
                buffer[9] === 0x45 &&
                buffer[10] === 0x42 &&
                buffer[11] === 0x50
            );

        case '.pdf':
            // PDF signature: %PDF- (25 50 44 46 2D)
            return (
                buffer.length >= 5 &&
                buffer[0] === 0x25 &&
                buffer[1] === 0x50 &&
                buffer[2] === 0x44 &&
                buffer[3] === 0x46 &&
                buffer[4] === 0x2D
            );

        case '.doc':
            // OLE Compound File Binary Format: D0 CF 11 E0 A1 B1 1A E1
            return (
                buffer.length >= 8 &&
                buffer[0] === 0xD0 &&
                buffer[1] === 0xCF &&
                buffer[2] === 0x11 &&
                buffer[3] === 0xE0 &&
                buffer[4] === 0xA1 &&
                buffer[5] === 0xB1 &&
                buffer[6] === 0x1A &&
                buffer[7] === 0xE1
            );

        case '.docx':
            // ZIP archive signature: PK\x03\x04 (50 4B 03 04)
            // or empty zip / spanned zip: PK\x05\x06, PK\x07\x08
            return (
                buffer.length >= 4 &&
                buffer[0] === 0x50 &&
                buffer[1] === 0x4B &&
                (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
                (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
            );

        default:
            return false;
    }
}

function validateAttachment(file) {
    if (!file || !file.buffer) {
        throw new Error('File is required');
    }

    if (!file.originalname) {
        throw new Error('Invalid file name');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ACCEPTED_ATTACHMENT_EXTENSIONS.includes(ext)) {
        throw new Error('Invalid file type');
    }

    if (!ACCEPTED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid file type');
    }

    if (!checkMagicBytes(file.buffer, ext)) {
        throw new Error('File content does not match its extension');
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error('File size exceeds the limit');
    }
}

function validateAvatar(file) {
    if (!file || !file.buffer) {
        throw new Error('No file uploaded');
    }

    if (!file.originalname) {
        throw new Error('Invalid file name');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ACCEPTED_AVATAR_EXTENSIONS.includes(ext)) {
        throw new Error('Invalid file type');
    }

    if (!ACCEPTED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Invalid file type');
    }

    if (!checkMagicBytes(file.buffer, ext)) {
        throw new Error('File content does not match its extension');
    }

    if (file.size > MAX_AVATAR_SIZE) {
        throw new Error('File size exceeds the limit');
    }
}

module.exports = {
    ACCEPTED_ATTACHMENT_EXTENSIONS,
    ACCEPTED_ATTACHMENT_MIME_TYPES,
    MAX_ATTACHMENT_SIZE,
    ACCEPTED_AVATAR_EXTENSIONS,
    ACCEPTED_AVATAR_MIME_TYPES,
    MAX_AVATAR_SIZE,
    checkMagicBytes,
    validateAttachment,
    validateAvatar,
};
