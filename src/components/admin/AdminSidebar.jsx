import React, { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, Tags, Shield, LogOut, Loader2 } from 'lucide-react';
import { fetchSyncUser, ROLES, logout } from '../../lib/authStore';

export default function AdminSidebar({ activePage }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function sync() {
        const u = await fetchSyncUser();
        if (!u) {
            window.location.href = '/admin/login';
        } else {
            setUser(u);
            setLoading(false);
        }
    }
    sync();
  }, []);

  if (loading || !user) {
      return (
          <aside className="w-64 bg-[#1a1a1a] flex items-center justify-center fixed h-full z-50">
              <Loader2 className="animate-spin text-gray-600" />
          </aside>
      );
  }

  const isGodTier = user.role === ROLES.ADMIN;
  const isGatekeeper = user.role === ROLES.EDITOR || isGodTier;

  return (
    <aside className="w-64 bg-[#1a1a1a] text-white flex flex-col fixed h-full z-50 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <a href="/admin" className="font-black text-xl tracking-tight hover:text-gray-200 transition-colors">
          VOX<span className="text-[#008751]">.</span>CMS
        </a>
      </div>
      
      <div className="px-6 py-6 border-b border-gray-800">
         <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Signed in as</p>
         <div className="font-bold text-white truncate">{user.name}</div>
         <div className="text-[10px] font-black uppercase tracking-widest text-[#FAFF00] mt-1">
            {user.role}
         </div>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <a 
          href="/admin" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
            activePage === 'dashboard' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          Dashboard
        </a>
        <a 
          href="/admin/stories" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'stories' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Stories
        </a>
        
        {isGatekeeper && (
            <a 
            href="/admin/categories" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activePage === 'categories' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            >
            <Tags className="w-4 h-4" />
            Categories
            </a>
        )}

        <a 
          href="/admin/authors" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'authors' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Authors
        </a>

        {isGodTier && (
            <>
                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-600">System</p>
                </div>
                <a 
                href="/admin/admins" 
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePage === 'admins' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                >
                <Shield className="w-4 h-4" />
                Admins & Roles
                </a>
                <a 
                href="/admin/settings" 
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePage === 'settings' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                >
                <Settings className="w-4 h-4" />
                Settings
                </a>
            </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
            <LogOut className="w-4 h-4" />
            Sign Out
        </button>
      </div>
    </aside>
  );
}