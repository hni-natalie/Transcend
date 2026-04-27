import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../features/auth/services/authService';
import { ROUTE_PATH as R } from '../../config/routes.manifest';

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
        <div className="h-screen w-screen bg-[#0d0d0d] flex justify-center items-center m-0">
            <div className="w-full max-w-[520px] flex flex-col items-center">
                <h1 
                    className="text-[72px] text-[#D0F05C] mb-[35px] cursor-pointer"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                    onClick={onBack}
                >
                    WorkFrom,
                </h1>

                <div className="w-[60%]">
                    <button 
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-[16px] rounded-lg text-[16px] flex items-center justify-center gap-[12px] cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        onClick={handleGoogleLogin}
                    >
                        Continue with Google
                    </button>

                    <div className="my-[24px] text-[#9ca3af] text-[14px] w-full text-center">or</div>

                    <form className="w-full flex flex-col gap-[12px]" onSubmit={handleEmailLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="bg-[#1a1a1a] border border-[#222] text-white p-[16px] rounded-lg text-[14px] outline-none transition-colors duration-200 focus:border-[#D0F05C]"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="bg-[#1a1a1a] border border-[#222] text-white p-[16px] rounded-lg text-[14px] outline-none transition-colors duration-200 focus:border-[#D0F05C]"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                        />

                        <button 
                            type="submit" 
                            className="bg-[#2d3321] text-[#D0F05C] border-none p-[16px] rounded-lg font-bold text-[16px] cursor-pointer mt-[12px] w-full"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>

                        <p className="text-[#ff4d4f] text-center text-[14px] my-[8px] min-h-[20px]">{error}</p>
                    </form>
                </div>
                
                <div className="mt-[24px] text-[#9ca3af] text-[14px] text-center">
                    <p>No account? <span className="text-[#6b7280] font-semibold underline cursor-pointer">Contact us</span>.</p>
                    <p className="mt-[50px] text-[14px] text-[#6b7280] leading-[1.6] text-center w-full">
                        By continuing, you acknowledge that you understand <br />
                        and agree to the <span className="text-[#6b7280] font-semibold underline cursor-pointer">Terms & Conditions</span>{' '}
                        and <span className="text-[#6b7280] font-semibold underline cursor-pointer">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};
