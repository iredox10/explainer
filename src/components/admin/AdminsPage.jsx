import React, { useState, useEffect } from 'react';
import { Plus, Shield, Trash2, Mail, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';

const AVAILABLE_CATEGORIES = ["Technology", "Culture", "Politics", "Science", "Economy", "Super Feature"];

export default function AdminsPage() {
  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Contributor", assignedCategories: [] });

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else if (u.role !== ROLES.ADMIN) {
      window.location.href = '/admin';
    } else {
      setUser(u);
      setAdmins([
        { id: 1, name: "System Admin", email: "admin@vox.africa", role: ROLES.ADMIN, status: "Active", lastActive: "Now", assignedCategories: [] },
        { id: 2, name: "Editor in Chief", email: "editor@vox.africa", role: ROLES.EDITOR, status: "Active", lastActive: "2h ago", assignedCategories: ["Technology", "Culture"] },
      ]);
    }
  }, []);

  const handleDelete = (id) => {
    if (confirm("Revoke access for this user? This action is permanent.")) {
      setAdmins(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleInviteUser = (e) => {
    e.preventDefault();
    setAdmins([...admins, { id: Date.now(), ...newUser, status: "Invited", lastActive: "Never" }]);
    setNewUser({ name: "", email: "", role: "Contributor", assignedCategories: [] });
    setIsModalOpen(false);
  };

  const toggleCategory = (category) => {
    setNewUser(prev => {
        const cats = prev.assignedCategories.includes(category) 
            ? prev.assignedCategories.filter(c => c !== category)
            : [...prev.assignedCategories, category];
        return { ...prev, assignedCategories: cats };
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="admins" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admins & Team</h1>
            <p className="text-gray-500 text-sm mt-1">Manage system access and roles</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#121212] hover:bg-[#008751] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </header>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Access Scope</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                        <Shield className={`w-3 h-3 ${user.role === ROLES.ADMIN ? 'text-[#008751]' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-700">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === ROLES.ADMIN ? (
                        <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded-sm uppercase tracking-wider">Full Access</span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {user.assignedCategories?.length > 0 ? user.assignedCategories.map(cat => (
                                <span key={cat} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                    {cat}
                                </span>
                            )) : <span className="text-xs text-gray-400 italic">No specific access</span>}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 ${
                      user.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' :
                      user.status === 'Invited' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Active' ? 'bg-green-600' : 
                        user.status === 'Invited' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{user.lastActive}</span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    {user.role !== ROLES.ADMIN && (
                        <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">Invite New User</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751] transition-colors"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751] transition-colors"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751] transition-colors"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value={ROLES.CONTRIBUTOR}>Contributor</option>
                    <option value={ROLES.EDITOR}>Editor</option>
                    <option value={ROLES.ADMIN}>Super Admin</option>
                  </select>
                </div>

                {newUser.role !== ROLES.ADMIN && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Assign Access (Categories)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleCategory(cat)}
                                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all text-left ${
                                        newUser.assignedCategories.includes(cat)
                                            ? 'bg-green-50 border-[#008751] text-[#008751]'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {newUser.assignedCategories.includes(cat) ? '✓ ' : '+ '}
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#008751] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#006b3f] transition-colors shadow-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}