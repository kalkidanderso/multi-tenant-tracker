"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/apiClient";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  project: { id: string; name: string };
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  comments: Comment[];
}

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [commentBody, setCommentBody] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const data = await api.get<{ issue: Issue }>(`/issues/${id}`);
      setIssue(data.issue);
    } catch (err: any) {
      setError(err.message || "Failed to locate anomaly record");
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setPostingComment(true);

    try {
      await api.post(`/issues/${id}/comments`, { body: commentBody });
      setCommentBody("");
      fetchIssue(); // reload to get new comment
    } catch (err: any) {
      alert(err.message || "Comment formulation failed");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-red-500/20 max-w-2xl mx-auto mt-12 bg-red-500/5">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h2 className="text-xl font-bold text-red-100 mb-2">Record Not Found</h2>
        <p className="text-red-400/80 max-w-md mx-auto text-sm mb-6 font-mono">{error}</p>
        <Link href="/dashboard/issues" className="text-blue-400 hover:text-blue-300 transition-colors uppercase font-mono text-xs tracking-widest border border-blue-400/30 px-4 py-2 rounded">
          Return to Ledger
        </Link>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link 
        href="/dashboard/issues" 
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mb-4 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
        Return to Ledger
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (Left, 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-8xl font-black">{issue.id.substring(0,2).toUpperCase()}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-2.5 py-1 text-xs uppercase font-mono tracking-widest rounded border ${getStatusColor(issue.status)}`}>
                {issue.status.replace("_", " ")}
              </span>
              <span className="text-zinc-500 font-mono text-xs uppercase">
                {new Date(issue.createdAt).toLocaleString()}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90 mb-6 leading-tight relative z-10">
              {issue.title}
            </h1>

            <div className="prose prose-invert prose-blue max-w-none text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans relative z-10">
              {issue.description || <span className="text-zinc-600 italic">No diagnostic payload provided in initialization.</span>}
            </div>
          </div>

          <div className="glass-panel p-6 pb-2 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               Discussion Thread
            </h3>
            
            <div className="space-y-4">
              {issue.comments.length === 0 ? (
                <div className="p-8 text-center border border-white/5 border-dashed rounded-xl">
                  <p className="text-sm font-mono uppercase text-zinc-600">No transmissions in this thread.</p>
                </div>
              ) : (
                issue.comments.map(c => (
                  <div key={c.id} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-xs font-bold ring-1 ring-white/10 mt-1">
                      {c.author.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <span className="text-sm font-semibold text-blue-400">{c.author.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="pt-4 border-t border-white/5 mt-6 pb-4">
              <label className="sr-only">New comment</label>
              <textarea
                required
                className="glass-input w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/50 min-h-[100px] mb-3"
                placeholder="Append transmission to ledger..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                 type="submit"
                 disabled={postingComment}
                 className="btn-primary px-6 py-2 rounded-lg text-sm hover-lift disabled:opacity-50 flex items-center gap-2 font-mono uppercase tracking-widest"
                >
                  {postingComment && <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />}
                  Transmit
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar (Right, 1/3) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                Project Context
              </p>
              <div className="bg-white/5 rounded-lg border border-white/5 px-3 py-2 text-sm font-medium text-white/90">
                {issue.project.name}
              </div>
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Threat Level
              </p>
              <span className={`inline-block px-3 py-1.5 text-xs uppercase font-mono tracking-widest rounded border ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
            </div>

            <hr className="border-white/5" />

            <div>
               <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                Assigned Operative
              </p>
              <div className="flex items-center gap-3">
                {issue.assignedTo ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                      {issue.assignedTo.name.charAt(0)}
                    </div>
                    <span className="text-sm text-white/90">{issue.assignedTo.name}</span>
                  </>
                ) : (
                  <span className="text-sm font-mono text-zinc-500 italic uppercase">Unassigned</span>
                )}
              </div>
            </div>

            <div>
               <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Originator
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-white/10">
                    {issue.createdBy.name.charAt(0)}
                 </div>
                 <div className="flex flex-col">
                  <span className="text-sm text-white/90">{issue.createdBy.name}</span>
                  <span className="text-[10px] text-zinc-500">{issue.createdBy.email}</span>
                 </div>
              </div>
            </div>

            {issue.tags.length > 0 && (
              <>
                <hr className="border-white/5" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.2 4.1L8.8 20"/><path d="m8.2 4.1-5.4 15.9"/><path d="M3 9.5h18"/><path d="M3 14.5h18"/></svg>
                    Classifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {issue.tags.map(t => (
                      <span 
                        key={t.tag.id} 
                        className="px-2.5 py-1 rounded text-[10px] uppercase font-mono border"
                        style={{ backgroundColor: `${t.tag.color}15`, borderColor: `${t.tag.color}30`, color: t.tag.color }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
