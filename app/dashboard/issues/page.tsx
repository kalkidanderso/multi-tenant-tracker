"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  project: { id: string; name: string };
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  _count: { comments: number };
}

export default function IssuesPage() {
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters state
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "");
  const [search, setSearch] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ issues: Issue[], total: number }>("/issues", {
        params: {
          status: statusFilter,
          priority: priorityFilter,
          q: search,
          limit: "50"
        }
      });
      setIssues(data.issues);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, priorityFilter, search]);

  const getPriorityColor = (p: string) => {
    if (p === 'CRITICAL') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (p === 'HIGH') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    if (p === 'MEDIUM') return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  };

  const getStatusColor = (s: string) => {
    if (s === 'OPEN') return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    if (s === 'IN_PROGRESS') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    if (s === 'IN_REVIEW') return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    if (s === 'DONE') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Anomaly Logs</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-mono">System Issues & Exceptions ({total})</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Query Logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9 pr-4 py-2 rounded-lg text-sm w-48 transition-all focus:w-64"
            />
          </div>
          <select 
            className="glass-input px-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All States</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select 
            className="glass-input px-3 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <Link 
            href="/dashboard/issues/new" 
            className="btn-primary px-4 py-2 rounded-lg text-sm transition-all hover-lift flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Initialize
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          {issues.length === 0 ? (
             <div className="p-16 text-center text-zinc-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               <p className="font-mono uppercase tracking-widest text-sm">No anomalous records found matching criteria.</p>
             </div>
          ) : (
            <div className="divide-y divide-white/5">
              {issues.map(issue => (
                <Link 
                  key={issue.id} 
                  href={`/dashboard/issues/${issue.id}`}
                  className="block p-4 hover:bg-white/5 transition-all group border-l-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{issue.project.name}</span>
                        <div className="flex gap-1.5">
                          {issue.tags.map(t => (
                            <span 
                              key={t.tag.id} 
                              className="px-2 py-0.5 rounded text-[10px] uppercase font-mono border"
                              style={{ backgroundColor: `${t.tag.color}15`, borderColor: `${t.tag.color}30`, color: t.tag.color }}
                            >
                              {t.tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-white/90 group-hover:text-blue-400 transition-colors truncate">
                        {issue.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {issue.assignedTo ? issue.assignedTo.name : 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {issue._count.comments}
                        </span>
                        <span>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-widest rounded border ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-widest rounded border ${getStatusColor(issue.status)}`}>
                        {issue.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
