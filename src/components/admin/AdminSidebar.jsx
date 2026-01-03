import React, { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, Tags, Shield, LogOut, Loader2, Zap, UserPlus, Inbox, BookOpen, Menu, X } from 'lucide-react';
import { fetchSyncUser, ROLES, logout } from '../../lib/authStore';

export default function AdminSidebar({ activePage }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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
      <aside className="w-64 bg-black flex items-center justify-center fixed h-full z-50">
        <Loader2 className="animate-spin text-[#FAFF00]" />
      </aside>
    );
  }

  const isSuper = user.role === ROLES.ADMIN;
  const isEditor = user.role === ROLES.EDITOR || isSuper;

  return (
    <>
      {/* Mobile Toggle Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-6 z-[60] bg-black text-[#FAFF00] p-3 rounded-2xl shadow-2xl border border-white/10"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-64 bg-black text-white flex flex-col fixed h-full z-50 transition-all duration-500 border-r border-white/5 shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand */}
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <a href="/admin" className="font-black text-2xl tracking-tighter hover:text-[#FAFF00] transition-colors flex items-center gap-2">
            EXPLAINER<span className="text-[#FAFF00] font-serif italic text-3xl -ml-1">.</span>OS
          </a>
        </div>

        {/* Identity Card */}
        <div className="px-8 py-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FAFF00]/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-[#FAFF00]/20 transition-all duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Connected</p>
            <div className="font-bold text-sm text-white truncate mb-1">{user.name}</div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-[#FAFF00] text-black text-[9px] font-black uppercase tracking-widest leading-none">
              {user.role}
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pt-2">
          {/* Editorial Group */}
          <section className="space-y-1">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">Newsroom Core</p>
            <SidebarLink
              href="/admin"
              active={activePage === 'dashboard'}
              icon={<Layout className="w-4 h-4" />}
              label="Command Center"
            />
            <SidebarLink
              href="/admin/stories"
              active={activePage === 'stories'}
              icon={<FileText className="w-4 h-4" />}
              label="Article Desk"
            />

            {isEditor && (
              <SidebarLink
                href="/admin/categories"
                active={activePage === 'categories'}
                icon={<Tags className="w-4 h-4" />}
                label="Verticals"
              />
            )}

            <SidebarLink
              href="/admin/authors"
              active={activePage === 'authors'}
              icon={<PenTool className="w-4 h-4" />}
              label="Directory"
            />
            <SidebarLink
              href="/admin/guide"
              active={activePage === 'guide'}
              icon={<BookOpen className="w-4 h-4" />}
              label="Writing Guide"
            />
          </section>

          {/* Audience Group */}
          <section className="space-y-1">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">Audience</p>
            <SidebarLink
              href="/admin/newsletters"
              active={activePage === 'newsletters'}
              icon={<Zap className="w-4 h-4" />}
              label="Newsletters"
            />
          </section>

          {/* Assignments / Tasks */}
          <section className="space-y-1">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">Tasks</p>
            <SidebarLink
              href="/admin/submissions"
              active={activePage === 'submissions'}
              icon={<Inbox className="w-4 h-4" />}
              label="Guest Queue"
            />
          </section>

          {/* System Group (Superadmin Only) */}
          {isSuper && (
            <section className="space-y-1">
              <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#FAFF00]/40 mb-3">Enterprise Control</p>
              <SidebarLink
                href="/admin/admins"
                active={activePage === 'admins'}
                icon={<UserPlus className="w-4 h-4" />}
                label="Team & Access"
              />
              <SidebarLink
                href="/admin/settings"
                active={activePage === 'settings'}
                icon={<Zap className="w-4 h-4" />}
                label="Global Protocols"
              />
              <SidebarLink
                href="/admin/logs"
                active={activePage === 'logs'}
                icon={<Shield className="w-4 h-4" />}
                label="System Logs"
              />
            </section>
          )}
        </nav>

        {/* Terminal Footer */}
        <div className="p-6 border-t border-white/5 bg-white/2">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            De-authenticate
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ href, active, icon, label }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group ${active
        ? 'bg-[#FAFF00] text-black shadow-[0_10px_20px_rgba(250,255,0,0.15)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
    >
      <span className={`${active ? 'text-black' : 'text-gray-500 group-hover:text-[#FAFF00] transition-colors'}`}>{icon}</span>
      {label}
    </a>
  );
}
