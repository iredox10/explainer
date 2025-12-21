import React, { useState } from 'react';
import { Shield, Github, Mail, Loader2 } from 'lucide-react';
import { account } from '../../lib/appwrite';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const loginWithProvider = (provider) => {
    setIsLoading(true);
    // Appwrite will handle the redirect to Google/GitHub
    // and then back to our admin dashboard
    account.createOAuth2Session(
        provider, 
        `${window.location.origin}/admin`, // Success redirect
        `${window.location.origin}/admin/login` // Failure redirect
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-10">
            <span className="font-serif-display font-black text-5xl tracking-tighter text-black">
                Explainer<span className="text-[#FAFF00]">.</span>CMS
            </span>
            <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest leading-relaxed px-8">
                Secure Editorial Login
            </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 border border-gray-100 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FAFF00]"></div>

          <div className="space-y-4">
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                Sign in with your work account
            </p>

            <button
              onClick={() => loginWithProvider('google')}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-4 py-4 px-4 border-2 border-gray-100 rounded-xl shadow-sm text-sm font-black uppercase tracking-widest text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  <img src="https://www.gstatic.com/firebase/explore/google-logo.svg" className="h-5 w-5" alt="Google" />
                  Continue with Google
                </>
              )}
            </button>

            <button
              onClick={() => loginWithProvider('github')}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-4 py-4 px-4 border-2 border-gray-900 rounded-xl shadow-sm text-sm font-black uppercase tracking-widest text-white bg-gray-900 hover:bg-black transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  <Github className="h-5 w-5" />
                  Continue with GitHub
                </>
              )}
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SSO Protected</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                Only authorized members of the @vox.africa organization can access this area.
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <a href="/" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
                ← Public Site
            </a>
        </div>
      </div>
    </div>
  );
}
