import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from './shared/icons';
import { ToastContainer } from './shared/Toast';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signUp, signInWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setIsLoading(true);
        try {
            if (isLoginView) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (error) {
            // Error toast is handled by the useAuth hook
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <ToastContainer />
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 font-sans">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center text-center gap-3 mb-8">
                    <LogoIcon className="w-12 h-12 text-amber-500" />
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">ReddyFit AI Pro</h1>
                        <p className="text-slate-400 text-sm mt-1">Your AI-powered personal trainer.</p>
                    </div>
                </div>
                
                <div className="bg-slate-800/50 p-6 rounded-xl shadow-xl border border-slate-700/50">
                    <h2 className="text-xl font-bold text-center text-slate-100 mb-6">
                        {isLoginView ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-slate-300">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-3"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-slate-300">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-3"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-5 py-3 text-base font-semibold text-center text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 focus:ring-4 focus:outline-none focus:ring-amber-300 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="flex items-center my-5">
                        <div className="flex-1 border-t border-slate-600"></div>
                        <span className="px-4 text-sm text-slate-400">OR</span>
                        <div className="flex-1 border-t border-slate-600"></div>
                    </div>

                    <button
                        onClick={async () => {
                            if (!isLoading) {
                                setIsLoading(true);
                                try {
                                    await signInWithGoogle();
                                } catch (error) {
                                    console.error(error);
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        disabled={isLoading}
                        className="w-full px-5 py-3 text-base font-semibold text-center text-slate-900 bg-white rounded-lg hover:bg-slate-100 focus:ring-4 focus:outline-none focus:ring-slate-300 disabled:opacity-50 transition-all flex items-center justify-center gap-3 border border-slate-300"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <p className="text-sm text-center text-slate-400 mt-6">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-amber-400 hover:underline ml-1">
                            {isLoginView ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
                <p className="text-xs text-center text-slate-500 mt-6 px-4">
                    Forgot your password? Contact admin at <a href="mailto:akhilreddydanda3@gmail.com" className="underline hover:text-slate-400">akhilreddydanda3@gmail.com</a>
                </p>
            </div>
        </div>
        </>
    );
};