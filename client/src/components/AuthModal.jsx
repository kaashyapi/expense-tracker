import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, UserCheck, ArrowRight, Wallet } from 'lucide-react';

export default function AuthModal({ onLoginSuccess, isOnline, isGoogleConfigured = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await onLoginSuccess({ credential: credentialResponse.credential });
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    if (!isGoogleConfigured) {
      setError("Google OAuth Client ID is not configured in .env yet. Click 'Continue as Kashyapi' below to sign in instantly!");
    } else {
      setError('Google Sign-In was cancelled or encountered an error.');
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await onLoginSuccess({
        demo_mode: true,
        email: 'kashyapi.user@gmail.com',
        name: 'Kashyapi',
        picture: ''
      });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#09090b] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        
        {/* Brand Icon & Heading */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#121214] border border-[#27272a] mx-auto flex items-center justify-center text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Expense Tracker</h1>
        </div>

        {!isOnline && (
          <div className="p-3 rounded-lg bg-[#270e0e] border border-[#4a1818] text-xs text-[#fca5a5] text-left">
            You are currently offline. You won't be able to sign in until internet connection is restored.
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-[#270e0e] border border-[#4a1818] text-xs text-[#fca5a5] text-left">
            {error}
          </div>
        )}

        {/* Google Auth Integration */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              text="signin_with"
              size="large"
            />
          </div>

          {!isGoogleConfigured && (
            <p className="text-[11px] text-[#71717a] px-2 leading-relaxed">
              Google OAuth Client ID not yet set in <code className="text-white">.env</code>. Click the button below for instant 1-click access:
            </p>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1f1f23]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-[#52525b] uppercase font-mono tracking-wider">
              Or
            </span>
            <div className="flex-grow border-t border-[#1f1f23]"></div>
          </div>

          {/* Quick Dev/Demo Mode button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading || !isOnline}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-[#a1a1aa]" />
            <span>Continue as Kashyapi</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#71717a]" />
          </button>
        </div>

      </div>
    </div>
  );
}

