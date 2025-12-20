import React, { useState } from 'react';
import { Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { setCurrentUser, ROLES } from '../../lib/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate authentication
    // In the next step, we'll replace this with actual Appwrite login
    setTimeout(() => {
      if (email === 'admin@vox.africa' && password === 'password') {
        const user = { 
            id: 1, 
            name: 'System Admin', 
            role: ROLES.ADMIN, 
            email: 'admin@vox.africa' 
        };
        setCurrentUser(user);
        window.location.href = '/admin';
      } else if (email === 'editor@vox.africa') {
        const user = { 
            id: 2, 
            name: 'Chioma Okereke', 
            role: ROLES.EDITOR, 
            email: 'editor@vox.africa',
            categories: ["Technology", "Culture"] 
        };
        setCurrentUser(user);
        window.location.href = '/admin';
      } else {
        setError('Invalid credentials. Try admin@vox.africa / password');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-10">
            <span className="font-serif-display font-black text-5xl tracking-tighter text-black">
                Explainer<span className="text-[#FAFF00]">.</span>CMS
            </span>
            <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest">Editorial Portal</p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 border border-gray-100 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          {/* Top Yellow Bar Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FAFF00]"></div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FAFF00] focus:border-transparent focus:bg-white transition-all text-sm font-bold"
                placeholder="editor@vox.africa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FAFF00] focus:border-transparent focus:bg-white transition-all text-sm font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#008751] focus:ring-[#FAFF00] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-lg shadow-lg text-sm font-black uppercase tracking-[0.2em] text-white bg-black hover:bg-[#FAFF00] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-400">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Secure Admin Environment</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <a href="/" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
                ← Back to Main Site
            </a>
        </div>
      </div>
    </div>
  );
}
