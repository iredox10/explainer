import React from 'react';
import { Save, Globe, Bell, Shield, Users } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="settings" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Configure your site preferences</p>
          </div>
          <button className="bg-[#008751] hover:bg-[#006b3f] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </header>

        <div className="max-w-4xl space-y-8">
          
          {/* Section: General */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">General Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Site Title</label>
                  <input type="text" defaultValue="VOX.AFRICA" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Tagline</label>
                  <input type="text" defaultValue="Visual Journalism for the Future" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Site Description</label>
                <textarea className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751] h-20 resize-none">We explain the news through visual storytelling. Our interactive explainers break down complex topics.</textarea>
              </div>
            </div>
          </section>

          {/* Section: Branding */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Branding</h3>
            </div>
            <div className="p-6 grid grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#008751" className="w-8 h-8 rounded border-0 cursor-pointer" />
                  <span className="text-sm font-mono text-gray-600">#008751</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#d1fae5" className="w-8 h-8 rounded border-0 cursor-pointer" />
                  <span className="text-sm font-mono text-gray-600">#d1fae5</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
