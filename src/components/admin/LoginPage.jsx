import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { fetchSyncUser, loginWithEmail, acceptInvite, requestPasswordReset, completePasswordReset } from '../../lib/authStore';

export default function LoginPage() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // URL Params for Invite / Reset
  const [params, setParams] = useState({ userId: '', secret: '', teamId: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const userId = p.get('userId');
    const secret = p.get('secret');
    const teamId = p.get('teamId');
    const membershipId = p.get('membershipId');

    setParams({ userId, secret, teamId });

    if (membershipId && userId && secret && teamId) {
      handleAcceptance(teamId, membershipId, userId, secret);
      return;
    }

    // Password Reset Detection (userId + secret but NO teamId)
    if (userId && secret && !teamId) {
      setView('reset');
      return;
    }

    const checkSession = async () => {
      const user = await fetchSyncUser();
      if (user) {
        window.location.href = '/admin';
      }
    };
    checkSession();
  }, []);

  const handleAcceptance = async (tId, mId, uId, sec) => {
    setIsAccepting(true);
    try {
      await acceptInvite(tId, mId, uId, sec);
      setSuccessMsg("Invitation accepted! You've been successfully added to the Newsroom. Please sign in with your credentials.");
      setView('login');
    } catch (err) {
      console.error("Acceptance failed:", err);
      setError("Your invitation link may have expired or is invalid.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await requestPasswordReset(email);
      setSuccessMsg("Reset link sent! Please check your email inbox.");
      setView('login');
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await completePasswordReset(params.userId, params.secret, password);
      setSuccessMsg("Password successfully reset! You can now sign in.");
      setView('login');
    } catch (err) {
      setError(err.message || "Failed to reset password. Link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const user = await loginWithEmail(email, password);
      if (user) {
        window.location.href = '/admin';
      } else {
        setError("Access Denied: Your account is not authorized to access this CMS.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
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
          <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest leading-relaxed px-8">
            {view === 'login' ? 'Secure Editorial Login' :
              view === 'forgot' ? 'Security Recovery' : 'Create New Password'}
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 border border-gray-100 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FAFF00]"></div>

          <div className="mb-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg animate-in slide-in-from-top-2">
                <p className="text-xs font-bold text-red-700 leading-relaxed uppercase tracking-wider">
                  {error}
                </p>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border-l-4 border-[#008751] p-4 mb-6 rounded-r-lg animate-in slide-in-from-top-2">
                <p className="text-xs font-bold text-[#008751] leading-relaxed uppercase tracking-wider">
                  {successMsg}
                </p>
              </div>
            )}

            {isAccepting && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <Loader2 className="animate-spin w-8 h-8 text-[#FAFF00]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Joining Newsroom...</p>
              </div>
            )}
          </div>

          {view === 'login' && !isAccepting && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@vox.africa"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] focus:bg-white rounded-xl text-sm font-medium transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(null); setSuccessMsg(null); }}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] focus:bg-white rounded-xl text-sm font-medium transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-4 border-none rounded-xl shadow-[0_10px_20px_-5px_rgba(250,255,0,0.3)] text-sm font-black uppercase tracking-widest text-black bg-[#FAFF00] hover:bg-black hover:text-white hover:shadow-xl transition-all duration-300 disabled:opacity-50 group"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <p className="text-xs text-gray-400 italic mb-4">Enter your work email and we'll send you a recovery link.</p>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vox.africa"
                  className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] focus:bg-white rounded-xl text-sm font-medium transition-all duration-200 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black bg-[#FAFF00] hover:bg-black hover:text-white transition-all shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Send Recovery Link"}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }} className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black pt-2">Back to Dashboard</button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black bg-[#FAFF00] hover:bg-black hover:text-white transition-all shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Update Security Credentials"}
              </button>
            </form>
          )}

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enforced Security</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">
              {view === 'login' ? 'Only registered members of the editorial team can access this dashboard.' :
                'Forensic recovery protocol initiated for credential restoration.'}
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
