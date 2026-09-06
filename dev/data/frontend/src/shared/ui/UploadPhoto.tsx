import React, { useRef, ChangeEvent } from 'react';
import { IconCamera } from '@shared/ui/Icons';
import { DefaultAvatar } from '@shared/ui/DefaultAvatar';


interface UploadPhotoProps {
    onFileSelect: (file: File) => void;
    previewUrl?: string;
    isUploading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    mode?: 'create' | 'edit';
    fallbackName?: string;
}

export function UploadPhoto({
    onFileSelect,
    previewUrl = '',
    isUploading = false,
    size = 'md',
    disabled = false,
    className = '',
    mode = 'create',
    fallbackName = '',
}: UploadPhotoProps) {
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-28 h-28',
        lg: 'w-32 h-32'
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-9 h-9',
        lg: 'w-11 h-11'
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            e.target.value = '';
            return;
        }

        onFileSelect(file);
        
        e.target.value = '';
    };

    const handleClick = () => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const getInitials = () => {
        if (!fallbackName) return '';
        return fallbackName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isEdit = mode === 'edit';

	// EDIT MODE
    if (isEdit) {
        return (
            <div className={`flex relative ${className}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                />

                {/* Outer wrapper - controls size, no overflow hidden */}
                <div className={`relative ${sizeClasses[size]}`}>
                    
                    {/* Inner circle - clips the image/initials ONLY */}
                    <div 
                        className={`
                            relative flex items-center justify-center rounded-full
                            bg-background-2 overflow-hidden
                            w-full h-full
                            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {/* Loading spinner */}
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                <div className="w-5 h-5 border-2 border-accent-lime border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Display photo or fallback */}
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                alt="Profile"
                            />
						) : fallbackName ? (
                            <DefaultAvatar name={fallbackName} className="w-full h-full" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-background-3">
                                <IconCamera className="w-9 h-9 text-accent-lime" />
                        {/* // ) : (
                            // <div className="flex items-center justify-center w-full h-full text-2xl font-medium text-white bg-background-3">
                            //     {getInitials() || <IconCamera className="w-9 h-9 text-accent-lime" />} */}
                            </div>
                        )}
                    </div>

                    {/* Camera button - OUTSIDE the circle, not cropped within avatr */}
                    {!disabled && !isUploading && (
                        <div 
                            onClick={handleClick}
                            className="absolute bottom-0 right-0 bg-accent-lime rounded-full p-1.5 cursor-pointer hover:opacity-80 transition-opacity shadow-lg z-20"
                        >
                            <IconCamera className="w-4 h-4 text-background-2" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // CREATE MODE
    return (
        <div className={`flex relative ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />
            
            <div 
                onClick={handleClick}
                className={`
                    flex flex-col items-center justify-center rounded-full 
                    bg-background-2 cursor-pointer overflow-hidden 
                    ${sizeClasses[size]}
                    ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 transition-opacity'}
                `}
            >
                {isUploading ? (
                    <div className="w-5 h-5 border-2 border-accent-lime border-t-transparent rounded-full animate-spin" />
                ) : previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                    <div className={`text-accent-lime ${iconSizes[size]}`}>
                        <IconCamera
							className="w-full h-full"
							strokeWidth={1} />
                    </div>
                )}
            </div>
        </div>
    );
}
