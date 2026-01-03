import React, { useState, useEffect } from 'react';
import { Save, Globe, Shield, CheckCircle, AlertTriangle, Loader2, Zap } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { adminService } from '../../lib/services';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    site_name: 'EXPLAINER.AFRICA',
    maintenance_mode: false,
    breaking_news_active: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else if (u.role !== ROLES.ADMIN) {
      window.location.href = '/admin';
    } else {
      setUser(u);
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSettings();
      if (data) setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...dataToSave } = settings;
      const result = await adminService.updateSettings($id, dataToSave);
      setSettings(result);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
      <AdminSidebar activePage="settings" />

      <main className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8 bg-gray-50/50">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 rounded-lg">
                <Shield className="w-5 h-5 text-[#FAFF00]" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Global Control</h1>
            </div>
            <p className="text-gray-500 text-sm font-medium">Mission-critical site configurations and emergency overrides.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${savedStatus ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-[#008751]'
              }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedStatus ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedStatus ? 'System Synchronized' : 'Update Core Config'}
          </button>
        </header>

        <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Site Identity */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <Globe className="w-5 h-5 text-gray-400" />
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Infrastructure</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Editorial Identity (Site Name)</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#FAFF00] rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Emergency Protocols */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Kill Switches & Overrides</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                <div>
                  <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">Maintenance Mode</h4>
                  <p className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider">Redirect all traffic to holding page</p>
                </div>
                <button
                  onClick={() => toggle('maintenance_mode')}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenance_mode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50/30 rounded-2xl border border-yellow-100/50">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Zap className={`w-4 h-4 ${settings.breaking_news_active ? 'text-yellow-600 fill-yellow-600' : 'text-gray-300'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Breaking News Banner</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Activate sitewide emergency alert</p>
                  </div>
                </div>
                <button
                  onClick={() => toggle('breaking_news_active')}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.breaking_news_active ? 'bg-yellow-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.breaking_news_active ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
