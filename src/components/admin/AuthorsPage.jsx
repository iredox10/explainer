import React from 'react';
import { Plus, MoreVertical, Mail } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const AUTHORS = [
  { id: 1, name: "Chioma Okafor", role: "Senior Economics Reporter", email: "chioma@vox.africa" },
  { id: 2, name: "Chioma Okereke", role: "Senior Tech Correspondent", email: "c.okereke@vox.africa" },
  { id: 3, name: "Tunde Alabi", role: "Network Architect", email: "guest@vox.africa" },
];

export default function AuthorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="authors" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Authors</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your team and contributors</p>
          </div>
          <button className="bg-[#121212] hover:bg-[#008751] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Author
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUTHORS.map((author) => (
            <div key={author.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-[#008751] transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author.name}`} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <button className="text-gray-400 hover:text-gray-900 p-1">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#008751] transition-colors">{author.name}</h3>
              <p className="text-sm text-[#008751] font-medium mb-4">{author.role}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
                <Mail className="w-4 h-4" />
                {author.email}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
