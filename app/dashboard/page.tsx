"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import Link from "next/link";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    projectsCount: 0,
    openIssuesCount: 0,
    criticalIssuesCount: 0,
  });
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [projectsRes, allIssuesRes, critIssuesRes, recentRes] = await Promise.all([
          api.get<{ total: number }>("/projects", { params: { limit: "1" } }),
          api.get<{ total: number }>("/issues", { params: { limit: "1", status: "OPEN" } }),
          api.get<{ total: number }>("/issues", { params: { limit: "1", priority: "CRITICAL" } }),
          api.get<{ issues: any[] }>("/issues", { params: { limit: "5" } })
        ]);
        
        setStats({
          projectsCount: projectsRes.total,
          openIssuesCount: allIssuesRes.total,
          criticalIssuesCount: critIssuesRes.total
        });
        setRecentIssues(recentRes.issues);
      } catch (err) {
        console.error("Dashboard mount failed", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Active Project Repos", value: stats.projectsCount, icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Unresolved Exceptions", value: stats.openIssuesCount, icon: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z", color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Critical Priority", value: stats.criticalIssuesCount, icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01", color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">System Status</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-mono">Operations Overview</p>
        </div>
        <Link 
          href="/dashboard/issues/new" 
          className="btn-primary px-4 py-2 rounded-lg text-sm transition-all hover-lift"
        >
          Initialize Issue
        </Link>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl flex items-start justify-between border border-white/5 group hover:border-white/10 transition-colors">
            <div>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h2 className="text-4xl font-bold tracking-tighter text-white/90">{card.value}</h2>
            </div>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={card.color}>
                <path d={card.icon} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Issues Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-white/90">Latest Anomalies</h3>
          <Link href="/dashboard/issues" className="text-xs text-blue-400 hover:text-blue-300 font-mono uppercase tracking-widest transition-colors">View Logs →</Link>
        </div>
        <div className="divide-y divide-white/5">
          {recentIssues.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">No issues recorded in the active ledger.</div>
          ) : (
            recentIssues.map((issue) => (
              <Link key={issue.id} href={`/dashboard/issues/${issue.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                <div className={`w-2 h-2 rounded-full ${
                  issue.priority === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
                  issue.priority === 'HIGH' ? 'bg-orange-500' :
                  issue.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-zinc-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate group-hover:text-blue-400 transition-colors">{issue.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{issue.project?.name} • Logged by {issue.createdBy.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-[10px] uppercase font-mono tracking-widest rounded-md border ${
                    issue.status === 'OPEN' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    issue.status === 'IN_PROGRESS' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    issue.status === 'DONE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                  }`}>
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
