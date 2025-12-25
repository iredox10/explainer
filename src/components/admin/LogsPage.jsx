import React, { useState, useEffect } from 'react';
import { Shield, Clock, Terminal, Search, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { logService } from '../../lib/services';

export default function LogsPage() {
    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            window.location.href = '/admin/login';
        } else if (u.role !== ROLES.ADMIN) {
            window.location.href = '/admin';
        } else {
            setUser(u);
            fetchLogs();
        }
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const rawLogs = await logService.getSystemLogs();
            const mappedLogs = rawLogs.map(l => ({
                id: l.$id,
                action: l.event.split('.').pop().toUpperCase(),
                user: `${l.ip} (${l.countryName || 'Global'})`,
                time: new Date(l.time).toLocaleDateString() + ' ' + new Date(l.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                level: l.event.includes('delete') || l.event.includes('failure') ? 'warning' :
                    l.event.includes('create') ? 'success' : 'info',
                detail: `Client: ${l.clientName} on ${l.osName} (${l.deviceModel || 'Desktop'})`,
                icon: l.event.includes('session') ? <Terminal className="w-3 h-3" /> : <Shield className="w-3 h-3" />
            }));
            setLogs(mappedLogs);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
            <AdminSidebar activePage="logs" />

            <main className="ml-64 flex-1 p-8 bg-gray-50/50">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-lg text-[#FAFF00]">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Forensic Logs</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Real-time surveillance of system actions and security events.</p>
                    </div>
                    <button onClick={fetchLogs} className="bg-white border border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </header>

                <div className="max-w-6xl mx-auto space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-12 h-12 text-gray-200" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No surveillance records found.</p>
                        </div>
                    ) : logs.map((log) => (
                        <div key={log.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black transition-all">
                            <div className="flex items-center gap-8">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${log.level === 'critical' || log.level === 'warning' ? 'bg-red-50 text-red-600' :
                                    log.level === 'success' ? 'bg-[#008751]/10 text-[#008751]' : 'bg-gray-50 text-gray-400'
                                    }`}>
                                    {log.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">{log.action}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${log.level === 'warning' ? 'bg-red-500 text-white shadow-[0_5px_15px_rgba(239,68,68,0.2)]' : 'bg-gray-100 text-gray-400'
                                            }`}>{log.level}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 font-medium italic">{log.detail || 'Standard protocol event recorded.'}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{log.user}</p>
                                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.1em] mt-1">{log.time}</p>
                            </div>
                        </div>
                    ))}

                    {logs.length > 0 && (
                        <div className="p-8 border-2 border-dashed border-gray-100 rounded-[2rem] text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">End of records (showing active session audit)</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
