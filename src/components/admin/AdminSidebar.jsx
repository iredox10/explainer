import React from 'react';
import { Layout, FileText, Settings, PenTool, Tags, Shield } from 'lucide-react';

export default function AdminSidebar({ activePage }) {
  return (
    <aside className="w-64 bg-[#1a1a1a] text-white flex flex-col fixed h-full z-50">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <a href="/admin" className="font-black text-xl tracking-tight hover:text-gray-200 transition-colors">
          VOX<span className="text-[#008751]">.</span>CMS
        </a>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1">
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
        <a 
          href="/admin/categories" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'categories' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Tags className="w-4 h-4" />
          Categories
        </a>
        <a 
          href="/admin/authors" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'authors' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Authors
        </a>
        <a 
          href="/admin/admins" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'admins' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Admins
        </a>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <a 
          href="/admin/settings" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === 'settings' ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </a>
      </div>
    </aside>
  );
}
