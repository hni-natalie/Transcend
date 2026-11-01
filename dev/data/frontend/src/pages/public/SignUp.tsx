import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useAuth } from '@/features/auth/AuthContext';
import { EMAIL_REGEX } from '@shared';
import { loginInputClass } from './Login';

interface SignUpProps {
    onBackToLogin?: () => void;
}

interface SignUpFormState {
    firstName: string;
    lastName: string;
    workEmail: string;
}

const initialFormState: SignUpFormState = {
    firstName: '',
    lastName: '',
    workEmail: '',
};

export const SignUp = ({ onBackToLogin: propOnBackToLogin }: SignUpProps) => {
    const navigate = useNavigate();
    const onBack = () => { navigate('/'); };
    const handleBackToLogin = propOnBackToLogin || (() => { navigate(R.LOGIN); });
    const { signUp } = useAuth();

    const [form, setForm] = useState<SignUpFormState>(initialFormState);
    const [error, setError] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (field: keyof SignUpFormState) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const validateForm = (): string | null => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.workEmail.trim()) {
            return 'All fields are required.';
        }
        if (!EMAIL_REGEX.test(form.workEmail.trim())) {
            return 'Please enter a valid work email address.';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await signUp(form);
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh w-screen bg-background flex justify-center items-center m-0 px-6 py-10 sm:px-8">
            <div className="w-full max-w-[500px] flex flex-col items-center">
                {submitted ? (
                    <div className="w-full max-w-[400px] mx-auto mt-4 text-center animate-[fadeScaleIn_0.4s_ease-out]">
                        <style>{`
                            @keyframes fadeScaleIn {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            @keyframes drawCheck {
                                to { stroke-dashoffset: 0; }
                            }
                        `}</style>

						<h1
							className="brand-logo-lean text-4xl sm:text-5xl md:text-[44px] font-bold mb-6 sm:mb-10 pl-3 cursor-pointer"
							onClick={onBack}
						>
							WorkFrom,
						</h1>

                        <div className="rounded-xl bg-background-1 px-6 py-10 shadow-[0_0px_30px_rgba(5,5,5,0.5)]">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-lime shadow-[0_0_24px_rgba(200,255,90,0.35)] flex items-center justify-center">
                                <svg
                                    className="w-8 h-8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path
                                        d="M5 13l4 4L19 7"
                                        className="text-background-1"
                                        style={{
                                            strokeDasharray: 24,
                                            strokeDashoffset: 24,
                                            animation: 'drawCheck 0.4s ease-out 0.2s forwards',
                                        }}
                                    />
                                </svg>
                            </div>

                            <p className="text-white text-base lg:text-2xl font-medium mb-2">
                                Request submitted!
                            </p>
                            <p className="text-foreground-2 text-sm lg:text-base leading-relaxed">
                                Our support team will get in touch with you shortly.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate(R.LOGIN)}
                                className="mt-10 w-full max-w-[240px] mx-auto btn-lime"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-[440px] mx-auto flex flex-col items-center">
                        <h1
                            className="brand-logo-lean text-6xl sm:text-6xl md:text-[48px] font-bold mb-1 sm:mb-2 pl-3 cursor-pointer"
                            onClick={onBack}
                        >
                            WorkFrom,
                        </h1>
                        <p className="font-mono italic text-center text-foreground-3 text-xl sm:text-xl mb-12 sm:mb-14">
                            your virtual workspace.
                        </p>

                        {/* <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}> */}
						<form className="w-full max-w-[300px] mx-auto flex flex-col gap-5" onSubmit={handleSubmit}> 
                            <div className="flex flex-col gap-2">
                                <label htmlFor="firstName" className="text-base text-foreground-2">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    className={loginInputClass}
                                    value={form.firstName}
                                    onChange={handleChange('firstName')}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="lastName" className="text-base text-foreground-2">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    className={loginInputClass}
                                    value={form.lastName}
                                    onChange={handleChange('lastName')}
                                />
                            </div>

                            <div className="flex flex-col gap-2 mt-4">
                                <label htmlFor="workEmail" className="text-base text-foreground-2">
                                    Work Email
                                </label>
                                <input
                                    id="workEmail"
                                    type="email"
                                    placeholder="name@company.com"
                                    className={loginInputClass}
                                    value={form.workEmail}
                                    onChange={handleChange('workEmail')}
                                />
                                <p className="px-4 text-[0.975rem] sm:text-sm text-foreground-2 leading-relaxed">
                                    Tip: Preferably <span className="font-semibold">use your work email</span> so our
                                    support team can verify your account and workspace.
                                </p>
                            </div>

                            <div className="h-4">
                                {error && <p className="error-message text-center text-sm lg:text-base">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="btn-lime w-full py-3 text-base lg:text-lg font-bold"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Sign Up'}
                            </button>

                            <p className="text-center text-base sm:text-sm text-foreground-2 mt-2">
                                Already have access?{' '}
                                <button
                                    type="button"
                                    onClick={handleBackToLogin}
                                    className="font-semibold text-foreground-2 underline decoration-foreground-2/30 underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime transition-colors cursor-pointer"
                                >
                                    Log in.
                                </button>
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};