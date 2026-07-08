import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useAuth } from '@/features/auth/AuthContext';
import { IconGoogle } from '@shared';

declare global {
    interface Window {
        google: any;
    }
}

const loginInputClass = [
    "w-full rounded-lg",
    "bg-background-2",
    "px-4 py-3",
    "text-base lg:text-l text-white placeholder:text-white/85",
    "border-[0.5px] border-transparent",
    "hover:border-[0.5px] hover:border-accent-lime",
    "focus:border-[0.5px] focus:border-accent-lime",
    "focus:ring-1 focus:ring-accent-lime focus:ring-offset-0 focus:ring-opacity-50",
    "transition-all outline-none"
].join(" ");

export const Login = () => {
    const navigate = useNavigate();
    const { googleLogin, login } = useAuth(); 
    const [userEmail, setUserEmail] = useState<string>('');
    const [userPassword, setUserPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);
    const [isGoogleSDKLoaded, setIsGoogleSDKLoaded] = useState<boolean>(false);
    const googleInitialized = useRef<boolean>(false);

    const onBack = () => { navigate('/'); };

    const handleEmailLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(userEmail, userPassword);
            if (user.roleName === 'Admin') {
                navigate(R.ADMIN_DASHBOARD);
            } else {
                navigate(R.USER_DASHBOARD);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    // Load Google SDK
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // console.log('Google SDK loaded'); // debug
            setIsGoogleSDKLoaded(true);
        };
        script.onerror = () => {
            // console.error('Failed to load Google SDK'); // debug
            setError('Failed to load Google login. Please refresh the page.');
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Initialize Google when SDK is loaded
    useEffect(() => {
        if (isGoogleSDKLoaded && !googleInitialized.current) {
            googleInitialized.current = true;
            
            window.google?.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: async (response: any) => {
                    setGoogleLoading(true);
                    try {
                        const user = await googleLogin(response.credential);
                        if (user.roleName === 'Admin') {
                            navigate(R.ADMIN_DASHBOARD);
                        } else {
                            navigate(R.USER_DASHBOARD);
                        }
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Google login failed');
                    } finally {
                        setGoogleLoading(false);
                    }
                },
            });
        }
    }, [isGoogleSDKLoaded, googleLogin, navigate]);

    const handleGoogleLogin = async () => {
        if (!isGoogleSDKLoaded) {
            setError('Google login is still loading. Please try again.');
            return;
        }
        
        setGoogleLoading(true);

	// timeout if no prompt
    const timeoutId = setTimeout(() => {
        setGoogleLoading(false);
        setError('Google login timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    // prompt callback handles success/error
    window.google?.accounts.id.prompt((notification: any) => {
        clearTimeout(timeoutId);
        
        if (notification.isNotDisplayed()) {
            setError(`Google login couldn't display: ${notification.getNotDisplayedReason()}`);
            setGoogleLoading(false);
        }
        
        if (notification.isSkippedMoment()) {
            // popup closed or canceled
            setGoogleLoading(false);
        }

	    // if notification is displayed, keep loading true
        // callback will handle success via the initialize callback
    });
};


    return (
        <div className="h-screen w-screen bg-background flex justify-center items-center m-0">
            <div className="w-full max-w-[500px] flex flex-col items-center">
                <h1 
                    className="brand-logo-lean text-[48px] font-bold mb-9"
                    onClick={onBack}
                >
                    WorkFrom,
                </h1>

                <div className="w-[60%]">
                    {/* Google Login */}
                    <button 
                        className="btn-outline w-full py-3 text-base text-foreground-2 lg:text-lg font-medium flex items-center justify-center gap-6"
                        onClick={handleGoogleLogin}
                        disabled={!isGoogleSDKLoaded || googleLoading}
                    >
                        <IconGoogle className="w-5 h-5" />
                        {googleLoading ? 'Logging in...' : 'Continue with Google'}
                    </button>

					{/* Email Login */}
                    <div className="my-6 text-foreground-4 text-sm w-full text-center">or</div>
                    <form className="w-full flex flex-col gap-6" onSubmit={handleEmailLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            className={loginInputClass} 
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className={loginInputClass}
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                        />

                        <button 
                            type="submit" 
                            className="btn-lime w-full mt-3 py-3 text-base lg:text-lg font-bold"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>

						{/* Error */}
                        <div className="h-4">
                            {error && <p className="error-message text-center text-sm lg:text-base">{error}</p>}
                        </div>
                    </form>
                </div>
                
                <div className="mt-10 flex flex-col items-center gap-8 text-center">
					{/* No account */}
                    <p className="text-sm text-foreground-2">
                        No account?{' '}
                        <span className="font-semibold text-foreground-2 underline decoration-foreground-2/30 underline-offset-4 cursor-pointer hover:text-white hover:decoration-white transition-colors">
                            Contact us
                        </span>.
                    </p>

					{/* Legal */}
                    <p className="mt-15 text-[12px] md:text-sm text-foreground-2 leading-relaxed max-w-[320px] md:max-w-none opacity-80">
                        By continuing, you acknowledge that you understand <br className="hidden md:block" />
                        and agree to the{' '}
                        <span 
                            className="font-semibold text-foreground-3 underline decoration-foreground-3/30 underline-offset-4 cursor-pointer hover:text-accent-lime hover:decoration-accent-lime transition-all"
                            onClick={() => navigate(R.TERMS)}
                        >
                            Terms & Conditions
                        </span>
                        {' '}and{' '}
                        <span 
                            className="font-semibold text-foreground-3 underline decoration-foreground-3/30 underline-offset-4 cursor-pointer hover:text-accent-lime hover:decoration-accent-lime transition-all"
                            onClick={() => navigate(R.PRIVACY)}
                        >
                            Privacy Policy
                        </span>.
                    </p>
                </div>
            </div>
        </div>
    );
};