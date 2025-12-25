import React, { useState, useEffect } from 'react';
import { Plus, Shield, Trash2, Mail, X, Loader2, UserX, UserCheck, Settings } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { teamService, adminService } from '../../lib/services';

export default function AdminsPage() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "staff_writer" });

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else if (u.role !== ROLES.ADMIN) {
      window.location.href = '/admin';
    } else {
      setUser(u);
      loadData();
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileData, membershipData] = await Promise.all([
        adminService.getProfiles(),
        teamService.getTeamMembers()
      ]);

      setProfiles(profileData);

      // Filter: Show members who are in the team but haven't created a profile yet
      const activeEmails = new Set(profileData.map(p => p.email.toLowerCase()));
      const pending = membershipData.filter(m => !activeEmails.has(m.userEmail.toLowerCase()));

      setInvitations(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (profile) => {
    const newStatus = profile.status === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'active' ? 'Reactivate' : 'Suspend';

    if (confirm(`${action} access for ${profile.name}?`)) {
      try {
        await adminService.updateProfileStatus(profile.$id, newStatus);
        setProfiles(prev => prev.map(p => p.$id === profile.$id ? { ...p, status: newStatus } : p));
      } catch (e) {
        alert("Action failed: " + e.message);
      }
    }
  };

  const handleCancelInvite = async (membershipId) => {
    if (confirm("Revoke this invitation? The user will no longer be able to join.")) {
      try {
        await teamService.removeMember(membershipId);
        setInvitations(prev => prev.filter(i => i.$id !== membershipId));
      } catch (e) {
        alert("Failed to revoke invitation: " + e.message);
      }
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await teamService.inviteMember(newUser.email, newUser.name, newUser.role);
      alert("Invitation sent successfully!");
      setIsModalOpen(false);
      setNewUser({ name: "", email: "", role: "staff_writer" });
      loadData(); // Refresh to show the new invite
    } catch (error) {
      alert("Invite failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="admins" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-[#008751]" />
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">System Management</h1>
            </div>
            <p className="text-gray-500 text-sm">Control editorial hierarchy and user permissions.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black hover:bg-[#008751] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl"
          >
            Invite Newsroom Staff
          </button>
        </header>

        {/* Section 1: Active Newsroom */}
        <div className="mb-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-1">Active Newsroom Staff</h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                  <th className="px-8 py-5">User & Access</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading && profiles.length === 0 ? (
                  <tr><td colSpan="4" className="px-8 py-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-gray-200 mx-auto" /></td></tr>
                ) : profiles.map((profile) => (
                  <tr key={profile.$id} className={`hover:bg-gray-50/50 transition-colors group ${profile.status === 'suspended' ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 ${profile.status === 'suspended' ? 'bg-red-50 text-red-400 border-red-100' : 'bg-gray-50 text-black border-white shadow-sm'}`}>
                          {profile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm tracking-tight">{profile.name}</div>
                          <div className="text-[11px] text-gray-400 font-medium">{profile.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-gray-50 border border-gray-100 text-gray-500">
                        {profile.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-2 ${profile.status === 'active' ? 'bg-green-50 text-[#008751]' : 'bg-red-50 text-red-600'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${profile.status === 'active' ? 'bg-[#008751]' : 'bg-red-600'
                          }`}></span>
                        {profile.status}
                      </span>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {profile.email !== user.email && (
                          <button
                            onClick={() => toggleStatus(profile)}
                            className={`p-2 rounded-lg transition-all ${profile.status === 'active'
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            title={profile.status === 'active' ? 'Suspend User' : 'Activate User'}
                          >
                            {profile.status === 'active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg">
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && profiles.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-10 text-center">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No profiles synced yet.</p>
                      <p className="text-[10px] text-gray-300 mt-1">Profiles are created when users first sign in.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Pending Invitations */}
        {invitations.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#008751] mb-4 ml-1 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#008751] animate-pulse"></span>
              Pending Newsroom Invitations
              <span className="bg-[#008751] text-white px-2 py-0.5 rounded-full text-[8px] font-black">{invitations.length}</span>
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl border-l-4 border-l-[#008751]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                    <th className="px-8 py-5">Recipient</th>
                    <th className="px-8 py-5">Access Level</th>
                    <th className="px-8 py-5">Invited By</th>
                    <th className="px-8 py-5">Sent Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invitations.map((invite) => (
                    <tr key={invite.$id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 relative grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.userName}`}
                              alt=""
                              className="w-full h-full p-1"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                              <Mail className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm tracking-tight">{invite.userName}</div>
                            <div className="text-[11px] text-gray-400 font-medium">{invite.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-gray-50 border border-gray-100 text-gray-400">
                          {invite.roles[0]?.replace('_', ' ') || 'Staff'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-black flex items-center justify-center">
                            <Shield className="w-3 h-3 text-[#FAFF00]" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Super Admin</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[11px] font-bold text-gray-400 italic">
                          {new Date(invite.invited).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => handleCancelInvite(invite.$id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Cancel Invitation"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-white/20">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-xl uppercase tracking-tighter text-gray-900">Invite Newsroom Staff</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleInviteUser} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#008751] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all"
                    placeholder="Jane Doe"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#008751] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all"
                    placeholder="staff@vox.africa"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Newsroom Role</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-[#008751] focus:bg-white rounded-2xl text-sm font-black uppercase tracking-widest outline-none transition-all appearance-none"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="staff_writer">Staff Writer</option>
                    <option value="editor">Section Editor</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="submit" disabled={isLoading} className="flex-1 bg-[#FAFF00] hover:bg-black hover:text-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Mail className="w-5 h-5" />}
                    Send Invitation
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