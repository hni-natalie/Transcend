// Security & Regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SUSPICIOUS_MARKUP_REGEX = /<\s*script|<\s*\/?\s*[a-z]|javascript:|on\w+\s*=/i;

// Files & Uploads
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif'];
export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif';
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
];

// User Validation
export const USER_NAME_MAX_LENGTH = 100;

// Task Validation
export const TASK_TITLE_MAX_LENGTH = 50;
export const TASK_DESC_MAX_LENGTH = 200;

// Meeting Validation
export const MEETING_TITLE_MAX_LENGTH = 60;
export const MEETING_DESC_MAX_LENGTH = 500;
export const MIN_MEETING_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
export const MAX_MEETING_DURATION_MS = 20 * 60 * 1000; // 20 minutes

// Message Validation
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_GROUP_NAME_LENGTH = 25;
