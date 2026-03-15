"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER"
  });

  const canInvite = currentUser?.role === "OWNER" || currentUser?.role === "ADMIN";

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: User[], total: number }>("/users");
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/users", formData);
      setFormData({ name: "", email: "", password: "", role: "MEMBER" });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to provision operative");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Personnel Ledger</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-mono">Active System Operatives ({total})</p>
        </div>
        {canInvite && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-lg text-sm transition-all hover-lift flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Provision Operative
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold">Operative</th>
                <th className="px-6 py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold">Contact Node</th>
                <th className="px-6 py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold text-center">Clearance</th>
                <th className="px-6 py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold text-right">Provisioned On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 group-hover:ring-blue-500/50 transition-all text-zinc-300">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white/90">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[10px] uppercase font-mono tracking-widest rounded border ${
                      u.role === 'OWNER' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      u.role === 'ADMIN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-zinc-500 font-mono uppercase">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl">
            <h2 className="text-xl font-bold mb-1 text-white">Provision New Operative</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6 uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">ID Generation Protocol</p>
            
            {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 border border-red-500/20 rounded-lg">{error}</div>}
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Full Designation</label>
                <input
                  required
                  type="text"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Contact E-Mail</label>
                <input
                  required
                  type="email"
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@rudratek.co.in"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Initial Passcode</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Clearance Level</label>
                <select
                  className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="MEMBER">MEMBER (Standard Access)</option>
                  {currentUser?.role === "OWNER" && (
                    <option value="ADMIN">ADMIN (Elevated Access)</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 py-2 rounded-lg text-sm transition-all hover-lift disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                  Execute Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
