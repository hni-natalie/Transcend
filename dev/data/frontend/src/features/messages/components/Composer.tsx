import React, { useEffect, useRef, useState } from 'react';
import {
  IconEmoji,
  IconFile,
  IconImage,
  IconPlus,
  MAX_MESSAGE_LENGTH,
  MAX_FILE_SIZE,
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  ACCEPTED_MIME_TYPES,
  SUSPICIOUS_MARKUP_REGEX,
} from '@shared';
import { useToast } from '@/context/ToastContext';
import { messagesApi } from "../api/messages.api";
import type { Attachment, UploadedAttachment } from '../types';
import { formatFileSize } from '../lib/format';
import { RemoveButton } from './UserRow';

const validateSendMessageForm = (data: {
  text: string;
  hasAttachments: boolean;
}): string | null => {
  const trimmed = data.text.trim();
  if (!trimmed && !data.hasAttachments) {
    return 'Message text or attachment is required.';
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be under ${MAX_MESSAGE_LENGTH} characters.`;
  }
  if (SUSPICIOUS_MARKUP_REGEX.test(trimmed)) {
    return 'Message contains characters that are not allowed.';
  }
  return null;
};

const validateAttachmentFile = (file: File): string | null => {
  if (!file) {
    return 'File is required.';
  }
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const isValidExt = ACCEPTED_FILE_EXTENSIONS.includes(ext);
  const isValidMime = ACCEPTED_MIME_TYPES.includes(file.type);

  if (!isValidExt && !isValidMime) {
    return 'Invalid file type. Only PDF, DOC, DOCX, and images (PNG, JPG, GIF) are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds the 10MB limit.';
  }
  return null;
};

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😊', '😅', '😎', '🤩', '😍', '🤗', '🤔', '😭', '😌', '😏'] },
  { name: 'Gestures', emojis: ['👍', '👏', '👋', '🤝', '🙏', '💪', '✌️', '🤞', '👊', '🙌'] },
  { name: 'Symbols', emojis: ['✅', '🔥', '💯', '✨', '💡', '🎉', '🚨', '🔍', '🌟', '🚀'] },
  { name: 'Work', emojis: ['📅', '📋', '📈', '📊', '🎯', '📌', '🏁', '⚠️', '📂', '🔗'] },
] as const;

interface PendingAttachment {
  localId: string;
  file: File;
  progress: number; // 0-100
  status: 'uploading' | 'done' | 'error';
  attachment?: UploadedAttachment;
}

interface ComposerProps {
  contactName: string;
  conversationId?: string;
  onSend?: (text: string, attachments?: UploadedAttachment[]) => void;
  disabled?: boolean;
}

function pendingAttachmentIcon(file: File) {
  return file.type.startsWith('image/') ? IconImage : IconFile;
}

export function Composer({ contactName, conversationId, onSend, disabled = false }: ComposerProps) {
  const [value, setValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUploading = pendingAttachments.some((item) => item.status === 'uploading');
  const completedAttachments = pendingAttachments.filter((item) => item.status === 'done' && item.attachment);
  const canSend = !disabled && !isUploading && (value.trim().length > 0 || completedAttachments.length > 0);

  const showComposerError = (message: string) => {
    setComposerError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setComposerError(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const error = validateSendMessageForm({
      text: value,
      hasAttachments: completedAttachments.length > 0,
    });

    if (error) {
      showComposerError(error);
      return;
    }

    if (!canSend) {
      return; // still uploading, or disabled prop — nothing to say here
    }

    const attachments = completedAttachments.map((item) => item.attachment!);

    onSend?.(value.trim(), attachments.length > 0 ? attachments : undefined);
    setValue('');
    setPendingAttachments([]);
    setShowEmojiPicker(false);
    setComposerError(null);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleEmojiClick = (emoji: string) => {
    setValue((previous) => previous + emoji);
    textareaRef.current?.focus();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // check: keep arguments and { attachment } response shape match with the API and BE
  const uploadFile = async (file: File) => {
    const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setPendingAttachments((previous) => [...previous, { localId, file, progress: 0, status: 'uploading' }]);

    if (!conversationId) {
      console.error('Attachment upload failed: no conversationId');

      setPendingAttachments((previous) =>
        previous.map((item) => (item.localId === localId ? { ...item, status: 'error' } : item)),
      );

      return;
    }

    try {
      const response = await messagesApi.uploadAttachment(conversationId, file, (percent) => {
        setPendingAttachments((previous) =>
          previous.map((item) => (item.localId === localId ? { ...item, progress: percent } : item)),
        );
      });

      setPendingAttachments((previous) =>
        previous.map((item) =>
          item.localId === localId
            ? { ...item, status: 'done', progress: 100, attachment: response }
            : item,
        ),
      );
    } catch (error) {
      console.error('Attachment upload failed:', error);

      setPendingAttachments((previous) =>
        previous.map((item) => (item.localId === localId ? { ...item, status: 'error' } : item)),
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    for (const file of files) {
      const error = validateAttachmentFile(file);
      if (error) {
        showToast('error', error);
        continue;
      }
      uploadFile(file);
    }

	// clear the input so can select same file again to upload when onChange triggered
    e.target.value = '';
  };

  const handleRemovePending = (localId: string) => {
    setPendingAttachments((previous) => previous.filter((item) => item.localId !== localId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node) &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mx-3 md:mx-7 mb-2 md:mb-5 mt-2.5 shrink-0">
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2">
          {pendingAttachments.map((item) => {
            const Icon = pendingAttachmentIcon(item.file);

            return (
              <div
                key={item.localId}
                className="group flex items-center gap-1.5 md:gap-2 bg-background-1 border border-border rounded-xl px-2 md:px-3 py-1.5 md:py-2 max-w-[160px] md:max-w-[240px]"
              >
                <Icon className="text-foreground-3 shrink-0 w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />

                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-foreground truncate">{item.file.name}</p>

                  {item.status === 'uploading' && (
                    <div className="h-1 mt-1 bg-background-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-lime transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'done' && (
                    <p className="text-[9px] md:text-xs text-foreground-3">{formatFileSize(item.file.size)}</p>
                  )}

                  {item.status === 'error' && <p className="text-[9px] md:text-xs text-red-400">Upload failed</p>}
                </div>

                <RemoveButton label={`Remove ${item.file.name}`} onClick={() => handleRemovePending(item.localId)} />
              </div>
            );
          })}
        </div>
      )}

      {composerError && (
        <div className="bg-red-500 text-white text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-t-xl">
          <span className="font-semibold">Error:</span> {composerError}
        </div>
      )}

      <div
        className={`flex items-center gap-2 md:gap-3 bg-background-1 border border-border pl-2 md:pl-4 pr-1.5 md:pr-2 py-1.5 md:py-2 relative ${
          composerError ? 'rounded-b-2xl' : 'rounded-2xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          aria-label="Add attachment"
          onClick={handleAttachClick}
          disabled={disabled}
          className="flex p-1 text-foreground-3 hover:text-foreground cursor-pointer transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconPlus className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <textarea
          ref={textareaRef}
          placeholder={disabled ? 'You can no longer send messages to Deleted User.' : `Message ${contactName}`}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-sm md:text-base text-foreground placeholder:text-foreground-3 resize-none overflow-y-auto max-h-[80px] md:max-h-[120px] min-h-[30px] md:min-h-[36px] py-1 md:py-1.5 leading-5 md:leading-6 disabled:cursor-not-allowed"
          style={{ height: '30px', lineHeight: '20px' }}
        />

        <button
          ref={emojiButtonRef}
          aria-label="Emoji"
          onClick={() => setShowEmojiPicker((previous) => !previous)}
          disabled={disabled}
          className={`flex p-1.5 md:p-2 cursor-pointer shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            showEmojiPicker
              ? 'text-accent-lime bg-accent-lime/10 rounded-full'
              : 'text-accent-lime hover:text-accent-lime/80 hover:bg-accent-lime/5 rounded-full'
          }`}
        >
          <IconEmoji className="w-[16px] h-[16px] md:w-[19px] md:h-[19px]" />
        </button>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`btn-lime py-1.5 md:py-2! px-4 md:px-6! text-[12px] md:text-[13.5px]! rounded-full! shrink-0 transition-opacity ${
            !canSend ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Send
        </button>

        {showEmojiPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full right-0 mb-2 z-50 bg-background-1 border border-border rounded-xl shadow-xl w-[260px] md:w-[320px] max-h-[240px] md:max-h-[320px] overflow-y-auto p-2 md:p-3"
          >
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.name} className="mb-2 md:mb-3 last:mb-0">
                <p className="text-[10px] md:text-sm text-foreground-3 font-medium uppercase tracking-wider mb-1 md:mb-1.5">
                  {category.name}
                </p>

                <div className="flex flex-wrap gap-0.5 md:gap-1">
                  {category.emojis.map((emoji, index) => (
                    <button
                      key={`${category.name}-${index}`}
                      onClick={() => handleEmojiClick(emoji)}
                      className="hover:bg-background-2 rounded-lg p-1 md:p-1.5 text-xl md:text-2xl transition-all hover:scale-110 transform active:scale-95 cursor-pointer"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}