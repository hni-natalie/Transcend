import React, { useState, useEffect } from 'react';
import { InputText, IconEye, IconEyeOff } from '@shared';
import { usePasswordValidation } from '@/features/auth';

export interface PasswordFieldProps {
    value: string;
    onChange: (value: string) => void;
    title?: string;
    placeholder?: string;
    required?: boolean;
    inputStyle?: string;
}

export const PasswordField = ({
    value,
    onChange,
    title = 'Password',
    placeholder = 'Enter password',
    required = false,
    inputStyle = 'bg-background',
}: PasswordFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showRequirements, setShowRequirements] = useState(false);
    const { getRequirements } = usePasswordValidation();

    const requirements = getRequirements(value);
    const allRequirementsMet = requirements.every(req => req.met);

    // auto close when reqs met
    useEffect(() => {
        if (showRequirements && value && allRequirementsMet) {
            const timer = setTimeout(() => {
                setShowRequirements(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [showRequirements, value, allRequirementsMet]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        if (newValue) {
            setShowRequirements(true);
        } else {
            setShowRequirements(false);
        }
    };

    const handleBlur = () => {
        // small delay to allow clicking inside the popup
        setTimeout(() => {
            setShowRequirements(false);
        }, 150);
    };

    const handleFocus = () => {
        if (value) {
            setShowRequirements(true);
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative w-full">
                <InputText
                    title={title}
                    placeholder={placeholder}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    required={required}
                    inputStyle={inputStyle}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9.5 text-foreground-3 hover:text-foreground-2 transition-colors cursor-pointer"
                >
                    {showPassword ? (
                        <IconEyeOff className="w-5 h-5" />
                    ) : (
                        <IconEye className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Popup */}
            {showRequirements && value && (
                <div className="absolute left-0 top-full mt-2 w-full min-w-[200px] max-w-[400px] bg-background-3 border border-background-3/50 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-base text-foreground-2 mb-2 font-medium">Password must contain:</p>
                    <div className="space-y-1">
                        {requirements.map((req) => (
                            <p
                                key={req.key}
                                className={`text-sm flex items-center gap-2 ${
                                    req.met ? 'text-accent-lime' : 'text-foreground-3'
                                }`}
                            >
                                {req.met ? '✓' : '○'} {req.label}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const usePasswordField = () => {
    const { validatePassword, getRequirements } = usePasswordValidation();
    return { validatePassword, getRequirements };
};