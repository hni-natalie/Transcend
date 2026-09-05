import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@api/api.client';

interface UseAvatarUploadOptions {
    targetUserId?: string;
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
    pendingFile: File | null;
}

export function useAvatarUpload({ 
    targetUserId, 
    onSuccess,
    onPreview,
}: UseAvatarUploadOptions = {}): UseAvatarUploadResult {
    const [isUploading, setIsUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const { showToast } = useToast();

    const uploadFile = async (file: File, userId?: string): Promise<string | null> => {
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
            const endpoint = (userId || targetUserId)
                ? `/users/avatar/${userId || targetUserId}`
                : '/users/avatar';

            const response = await apiClient.upload<{ avatarUrl: string }>(endpoint, formData);
            const url = response.avatarUrl;
            setAvatarUrl(url);
            onSuccess?.(url);
            showToast('success', 'Avatar updated successfully!');
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

        if (targetUserId) {
            await uploadFile(file);
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
        return uploadFile(pendingFile, newUserId);
    };

	const uploadPendingForSelf = async (): Promise<string | null> => {
		if (!pendingFile) return null;
		return uploadFile(pendingFile);
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
        pendingFile,
    };
}
