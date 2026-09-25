import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { ShieldCheck, TrendingUp, Globe2, Calculator } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EAF8F1] dark:bg-emerald-950/60 text-[#22A06B] dark:text-emerald-400 font-extrabold text-2xl shadow-sm mb-4 border border-[#22A06B]/20">
            CF
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1F2937] dark:text-gray-100">CapitalFlow</h1>
          <p className="mt-2 text-sm text-[#6B7280] dark:text-gray-400">
            Professional Investment Portfolio & Multi-Currency Management
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-[#1F2937] dark:text-gray-100">Welcome to CapitalFlow</h2>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-1">
              Sign in with your verified Google account to access your portfolio.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Continue with Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-[#1F2937] dark:text-gray-100 font-medium text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed hover:border-gray-400 dark:hover:border-gray-500"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#22A06B] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm font-semibold">Continue with Google</span>
          </button>

          {/* Secure privacy note */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 text-xs text-[#6B7280] dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
            <span>Isolated Cloud Firestore & Private User Data</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
            <Calculator className="w-5 h-5 mx-auto text-[#22A06B] mb-1" />
            <div className="text-[11px] font-semibold text-[#1F2937] dark:text-gray-200">Workbook Logic</div>
            <div className="text-[10px] text-[#6B7280] dark:text-gray-400">ROI & Profit Math</div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
            <Globe2 className="w-5 h-5 mx-auto text-[#22A06B] mb-1" />
            <div className="text-[11px] font-semibold text-[#1F2937] dark:text-gray-200">Multi-Currency</div>
            <div className="text-[10px] text-[#6B7280] dark:text-gray-400">SAR, BDT, USD, etc.</div>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-xs">
            <TrendingUp className="w-5 h-5 mx-auto text-[#22A06B] mb-1" />
            <div className="text-[11px] font-semibold text-[#1F2937] dark:text-gray-200">Recovery Phase</div>
            <div className="text-[10px] text-[#6B7280] dark:text-gray-400">Live Capital Tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
};
