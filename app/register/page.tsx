"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    orgName: "",
    orgSlug: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post<{ token: string; user: any }>("/auth/register", formData);
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to register tenant");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      orgName: val,
      // Auto-generate slug if it's currently empty or matches previous generation
      orgSlug: prev.orgSlug === generateSlug(prev.orgName) ? generateSlug(val) : prev.orgSlug,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505] py-12">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="glass-panel p-10 rounded-2xl w-full max-w-lg relative z-10 border border-white/5 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            System Deployment
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-mono uppercase tracking-widest">
            Initialize New Tenant
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Organization Name
              </label>
              <input
                required
                type="text"
                placeholder="Rudratek Global"
                className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.orgName}
                onChange={handleOrgNameChange}
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex justify-between">
                <span>Tenant Slug</span>
                <span className="text-zinc-600 font-mono lowercaes">ID</span>
              </label>
              <input
                required
                type="text"
                placeholder="rudratek-global"
                className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.orgSlug}
                onChange={(e) => setFormData({ ...formData, orgSlug: e.target.value.toLowerCase() })}
              />
            </div>
          </div>

          <hr className="border-white/5 my-4" />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Owner Name
            </label>
            <input
              required
              type="text"
              placeholder="System Administrator"
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Email Address
            </label>
            <input
              required
              type="email"
              placeholder="admin@rudratek.co.in"
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Secure Passcode
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              minLength={8}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-sm font-semibold tracking-wide hover-lift flex items-center justify-center gap-2 mt-6 disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            {loading ? "Allocating Resources..." : "Deploy Tenant Environment"}
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-400">
          Clearance already granted?{" "}
          <button 
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Authenticate Session
          </button>
        </div>
      </div>
    </div>
  );
}
