"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/components/AuthProvider";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { issues: number };
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canCreate = user?.role === "OWNER" || user?.role === "ADMIN";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api.get<{ projects: Project[] }>("/projects");
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/projects", formData);
      setFormData({ name: "", description: "" });
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to deploy project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Project Nodes</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-mono">Infrastructure Compartments</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-lg text-sm transition-all hover-lift"
          >
            Deploy Node
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full glass-panel p-12 text-center rounded-2xl border border-white/5">
              <p className="text-zinc-500 mb-4 font-mono uppercase tracking-widest text-sm">No Active Nodes</p>
              {canCreate && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 border border-blue-500/50 text-blue-400 rounded-lg text-sm hover:bg-blue-500/10 transition-colors"
                >
                  Deploy First Node
                </button>
              )}
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="glass-panel p-6 rounded-2xl flex flex-col border border-white/5 group hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold tracking-tight text-white/90 group-hover:text-blue-400 transition-colors">{p.name}</h3>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm flex-1 line-clamp-3 leading-relaxed mb-6">
                  {p.description || <span className="italic text-zinc-600">No metadata provided.</span>}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                  <div className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    Issues: <span className="text-white/80">{p._count.issues}</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono">
                    ID: {p.id.split("-")[0]}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* modal - primitive standard native way */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl">
            <h2 className="text-xl font-bold mb-1 text-white">Deploy Infrastructure Node</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6 uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">Project Generation Protocol</p>
            
            {error && <div className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</div>}
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Node Designation</label>
                <input
                  required
                  type="text"
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Core System API"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Metadata Description</label>
                <textarea
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="System requirements and domain boundaries..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
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
                  className="btn-primary px-4 py-2 rounded-lg text-sm transition-all hover-lift disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                  Execute Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
