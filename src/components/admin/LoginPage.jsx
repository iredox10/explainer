import React, { useState } from 'react';
import { Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { setCurrentUser, ROLES } from '../../lib/authStore';
import { account } from '../../lib/appwrite';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Create Appwrite Session
      await account.createEmailPasswordSession(email, password);
      
      // 2. Get User Details
      const user = await account.get();
      
      // 3. Determine Role (For now, we use prefs or a default)
      // In a real app, you'd set this via Appwrite Console or a setup script
      const role = user.prefs.role || ROLES.CONTRIBUTOR;
      const categories = user.prefs.categories || [];

      const sessionUser = { 
          id: user.$id, 
          name: user.name || user.email.split('@')[0], 
          role: role, 
          email: user.email,
          categories: categories
      };

      setCurrentUser(sessionUser);
      window.location.href = '/admin';
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
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
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FAFF00] focus:bg-white transition-all text-sm font-bold"
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
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FAFF00] focus:bg-white transition-all text-sm font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-lg shadow-lg text-sm font-black uppercase tracking-[0.2em] text-white bg-black hover:bg-[#FAFF00] hover:text-black transition-all duration-300 disabled:opacity-50 group"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-1" /></>}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Admin Environment</span>
          </div>
        </div>
      </div>
    </div>
  );
}