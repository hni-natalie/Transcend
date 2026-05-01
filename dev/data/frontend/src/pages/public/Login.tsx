import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { authService } from '@features/auth/services/authService';
import { IconGoogle } from '@shared';

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
    const [userEmail, setUserEmail] = useState<string>('');
    const [userPassword, setUserPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const onBack = () => { navigate('/'); };

    const handleEmailLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authService.login(userEmail, userPassword);
            console.log('Logged in!', data);

            if (data.user.roleName === 'Admin') {
                navigate(R.ADMIN_DASHBOARD);
            } else {
                navigate(R.USER_DASHBOARD);
            }
        } catch (err) {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        authService.loginWithGoogle();
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
                    <button 
                        className="btn-outline w-full py-3 text-base text-foreground-2 lg:text-lg font-medium flex items-center justify-center gap-6"
                        onClick={handleGoogleLogin}
                    >
						<IconGoogle className="w-5 h-5" />
                        Continue with Google
                    </button>

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

                        {/* Reserve 24px of space (h-6) for error message */}
						<div className="h-4">
							{error && <p className="error-message text-center text-sm lg:text-base">{error}</p>}
						</div>
                    </form>
                </div>
                
				<div className="mt-10 flex flex-col items-center gap-8 text-center">
					{/* Contact Section */}
					<p className="text-sm text-foreground-2">
						No account?{' '}
						<span className="font-semibold text-foreground-2 underline decoration-foreground-2/30 underline-offset-4 cursor-pointer hover:text-white hover:decoration-white transition-colors">
							Contact us
						</span>.
					</p>

					{/* Legal Section */}
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