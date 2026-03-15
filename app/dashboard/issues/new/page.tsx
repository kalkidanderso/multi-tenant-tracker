"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewIssuePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "OPEN",
    priority: "MEDIUM",
    projectId: "",
    assignedToId: "",
    dueDate: "",
    tagIds: [] as string[],
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSelectableData = async () => {
      try {
        const [projRes, userRes, tagRes] = await Promise.all([
          api.get<{ projects: any[] }>("/projects"),
          api.get<{ users: any[] }>("/users"),
          api.get<{ tags: any[] }>("/tags")
        ]);
        
        setProjects(projRes.projects);
        setUsers(userRes.users);
        setTags(tagRes.tags);
        
        if (projRes.projects.length > 0) {
          setFormData(prev => ({ ...prev, projectId: projRes.projects[0].id }));
        }
      } catch (err) {
        console.error("Failed to load select options", err);
      }
    };
    fetchSelectableData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: any = { ...formData };
      if (!payload.assignedToId) delete payload.assignedToId;
      if (!payload.dueDate) delete payload.dueDate;
      else payload.dueDate = new Date(payload.dueDate).toISOString();

      await api.post("/issues", payload);
      router.push("/dashboard/issues");
    } catch (err: any) {
      setError(err.message || "Failed to initialize issue");
      setSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Dependency Missing</h2>
        <p className="text-zinc-400 max-w-md text-sm mb-6 font-mono">System cannot initialize an issue without a designated project node. Deploy a project first.</p>
        <Link href="/dashboard/projects" className="btn-primary px-6 py-2 rounded-lg hover-lift">
          Go To Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">Initialize Anomaly Log</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-mono">New Support Record</p>
        </div>
        <Link 
          href="/dashboard/issues" 
          className="text-sm font-mono text-zinc-400 hover:text-white transition-colors"
        >
          [ABORT SEQUENCE]
        </Link>
      </header>

      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Log Title</label>
            <input
              required
              type="text"
              placeholder="System kernel panics on unauthorized access attempt..."
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/50"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Diagnostic Data (Markdown Supported)</label>
            <textarea
              className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/50 min-h-[200px]"
              placeholder="Provide stack traces, steps to reproduce, or contextual parameters."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Originating Project</label>
            <select
              required
              className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Assigned Operative</label>
            <select
              className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            >
              <option value="">-- Leave Unassigned --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Priority Classification</label>
            <select
              className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Initial State</label>
            <select
              className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Classification Tags</label>
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map(tag => {
                const isSelected = formData.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border ${
                      isSelected ? 'ring-2 ring-white/20' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      borderColor: `${tag.color}40`,
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {tags.length === 0 && <span className="text-sm text-zinc-500 italic">No tags defined in system.</span>}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex justify-end gap-4">
          <Link 
            href="/dashboard/issues"
            className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold tracking-wide hover-lift flex items-center gap-2"
          >
            {saving ? "Commiting to Database..." : "Commit Log"}
          </button>
        </div>
      </form>
    </div>
  );
}
