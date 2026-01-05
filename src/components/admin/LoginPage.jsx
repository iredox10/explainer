import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { fetchSyncUser, loginWithEmail, acceptInvite, requestPasswordReset, completePasswordReset } from '../../lib/authStore';

export default function LoginPage() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset', 'onboard', 'suspended'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // URL Params for Invite / Reset
  const [params, setParams] = useState({ userId: '', secret: '', teamId: '', membershipId: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const userId = p.get('userId');
    const secret = p.get('secret');
    const teamId = p.get('teamId') || p.get('teamID');
    const membershipId = p.get('membershipId') || p.get('membershipID');

    setParams({ userId, secret, teamId, membershipId });

    if (p.get('error') === 'suspended') {
      setView('suspended');
      return;
    }

    if (userId && secret) {
      if (teamId) {
        console.log("[AUTH] Invitation detected. Mode: Onboard");
        setView('onboard');
      } else {
        console.log("[AUTH] Recovery detected. Mode: Reset");
        setView('reset');
      }
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

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: params.userId,
          teamId: params.teamId,
          membershipId: params.membershipId,
          secret: params.secret,
          password
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Onboarding failed");

      // Successful onboarding! Now log them in.
      setSuccessMsg("Account activated! Authenticating...");
      const user = await loginWithEmail(data.email, password);
      if (user) {
        window.location.href = '/admin';
      }
    } catch (err) {
      setError(err.message || "Failed to complete onboarding.");
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
                    placeholder="name@explainer.africa"
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

          {view === 'onboard' && (
            <form onSubmit={handleOnboard} className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-black uppercase tracking-tighter text-black">Welcome to the Newsroom</h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">Initialize your secure access by creating a password for your account.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Password</label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Verify Password</label>
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
                className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest text-black bg-[#FAFF00] hover:bg-black hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Join Newsroom <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {view === 'suspended' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg animate-pulse">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-black mb-2">Access Revoked</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                Your administrative credentials have been suspended by the system controller.
              </p>
              <div className="mt-8 pt-8 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 italic mb-6">Contact your newsroom lead for restoration procedures.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-black hover:bg-red-600 transition-all"
                >
                  Exit Newsroom
                </button>
              </div>
            </div>
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
