import React, { useState } from 'react';
import { Layout, FileText, Settings, Plus, Search, MoreVertical, PenTool } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

// This component is effectively deprecated/renamed to StoriesPage, but we'll keep it as a wrapper 
// or alternate dashboard view if we want charts later. For now, I'll make it redirect conceptually
// by just importing StoriesPage content if we wanted, but for the user's request, 
// I've already updated src/pages/admin/index.astro to render StoriesPage directly.
// So this file can be kept as a backup or simplified to a dashboard home with stats.

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="dashboard" />
      <main className="ml-64 flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-300">Dashboard Widgets Coming Soon</h2>
            <p className="text-gray-400">Manage content via the sidebar.</p>
        </div>
      </main>
    </div>
  );
}