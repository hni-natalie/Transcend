import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@api/api.client';

interface UseAvatarUploadOptions {
    targetUserId?: string;
    targetConversationId?: string;
    onSuccess?: (avatarUrl: string) => void;
    onPreview?: (previewUrl: string) => void;
}

interface UseAvatarUploadResult {
    isUploading: boolean;
    avatarUrl: string | null;
	uploadError: string | null;
    setAvatarUrl: (url: string | null) => void;
    handleFileUpload: (file: File) => Promise<void>;
    handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    uploadPendingForUser: (userId: string) => Promise<string | null>;
	uploadPendingForSelf: () => Promise<string | null>;
    uploadPendingForGroup: (conversationId: string) => Promise<string | null>;
    pendingFile: File | null;
}

export function useAvatarUpload({ 
    targetUserId, 
    targetConversationId,
    onSuccess,
    onPreview,
}: UseAvatarUploadOptions = {}): UseAvatarUploadResult {
    const [isUploading, setIsUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const { showToast } = useToast();

    const uploadFile = async (
        file: File, 
        target?: string | { userId?: string; conversationId?: string }
    ): Promise<string | null> => {
        if (!file) return null;

        if (!file.type.startsWith('image/')) {
            const msg = 'Please select a valid image file';
            setUploadError(msg);
            showToast('error', msg);
            return null;
        }

        if (file.size > 10 * 1024 * 1024) {
            const msg = 'File size should be less than 10MB';
            setUploadError(msg);
            showToast('error', msg);
            return null;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const conversationId = typeof target === 'object' ? target?.conversationId : targetConversationId;
            const userId = typeof target === 'string' ? target : target?.userId || targetUserId;
            const isGroup = Boolean(conversationId);

            const endpoint = conversationId
                ? `/messages/${conversationId}/avatar`
                : userId
                ? `/users/avatar/${userId}`
                : '/users/avatar';

            const response = await apiClient.upload<{ avatarUrl: string }>(endpoint, formData);
            const url = response.avatarUrl;
            setAvatarUrl(url);
            onSuccess?.(url);
            showToast('success', isGroup ? 'Group avatar updated successfully!' : 'Avatar updated successfully!');
            return url;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
            setUploadError(errorMessage);
            showToast('error', errorMessage);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (file: File): Promise<void> => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = event.target?.result as string;
            setAvatarUrl(preview);
            onPreview?.(preview);
        };
        reader.readAsDataURL(file);

        if (targetUserId || targetConversationId) {
            await uploadFile(file, targetConversationId ? { conversationId: targetConversationId } : targetUserId);
        } else {
            setPendingFile(file);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleFileUpload(file);
    };

	const uploadPendingForUser = async (newUserId: string) => {
		if (!pendingFile) return null;
		const url = await uploadFile(pendingFile, newUserId);
		if (url) setPendingFile(null);
		return url;
	};

	const uploadPendingForSelf = async (): Promise<string | null> => {
		if (!pendingFile) return null;
		const url = await uploadFile(pendingFile);
		if (url) setPendingFile(null);
		return url;
	};

	const uploadPendingForGroup = async (conversationId: string): Promise<string | null> => {
		if (!pendingFile) return null;
		const url = await uploadFile(pendingFile, { conversationId });
		if (url) setPendingFile(null);
		return url;
	};

    return {
        isUploading,
        avatarUrl,
		uploadError,
        setAvatarUrl,
        handleFileUpload,
        handleAvatarUpload,
        uploadPendingForUser,
		uploadPendingForSelf,
        uploadPendingForGroup,
        pendingFile,
    };
}
