'use client';

import { useState } from 'react';

type ProjectAudit = {
  id: string;
  status: string;
  scoreOverall: number | null;
  issuesFound: number;
  createdAt: string;
  completedAt: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  verificationError: string | null;
  lastAudit: ProjectAudit | null;
};

type Props = {
  initialProjects: ProjectRow[];
  isPro: boolean;
};

export default function ProjectsClient({ initialProjects, isPro }: Props) {
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setProjects(data.projects || []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      domain: String(form.get('domain') || '').trim()
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to create project.');
    } else {
      setMessage('Project added.');
      await refresh();
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  async function handleRename(project: ProjectRow) {
    const nextName = window.prompt('Rename project:', project.name);
    if (!nextName || nextName.trim() === project.name) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nextName.trim() })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to rename project.');
    } else {
      await refresh();
    }
    setLoading(false);
  }

  async function handleVerify(project: ProjectRow) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to verify domain.');
    } else {
      setMessage(data.message || 'Verification complete.');
      await refresh();
    }
    setLoading(false);
  }

  async function handleDelete(project: ProjectRow) {
    if (!window.confirm(`Delete ${project.domain}? This removes audits and reports.`)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to delete project.');
    } else {
      await refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-slate-500">Manage client domains and verification status.</p>
        </div>
        <div className="text-xs text-slate-500">{loading ? 'Working...' : isPro ? 'PRO limits' : 'FREE limits'}</div>
      </section>

      {(error || message) && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            error ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="card p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold">Add Project</h2>
        <form onSubmit={handleCreate} className="grid gap-3">
          <input name="name" className="input" placeholder="Project name" required />
          <input name="domain" className="input" placeholder="example.com" required />
          <button type="submit" className="button" disabled={loading}>
            Add project
          </button>
        </form>
        {!isPro && (
          <p className="text-xs text-slate-500">Free plan allows one active domain.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="card p-6 text-sm text-slate-500">No projects yet.</div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-sm text-slate-500">{project.domain}</p>
                    <p className="text-xs text-slate-500">
                      Verification: {project.verificationStatus}
                      {project.verifiedAt ? ` • ${new Date(project.verifiedAt).toLocaleDateString()}` : ''}
                    </p>
                    {project.verificationError && (
                      <p className="text-xs text-red-200">{project.verificationError}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 rounded-lg border border-white/10 text-sm" onClick={() => handleVerify(project)}>
                      Verify
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-white/10 text-sm" onClick={() => handleRename(project)}>
                      Rename
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-white/10 text-sm" onClick={() => handleDelete(project)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {project.lastAudit ? (
                    <div className="flex flex-wrap gap-4">
                      <span>Status: {project.lastAudit.status}</span>
                      <span>Score: {project.lastAudit.scoreOverall ?? '—'}</span>
                      <span>Issues: {project.lastAudit.issuesFound}</span>
                      <span>
                        Last scanned:{' '}
                        {new Date(project.lastAudit.completedAt ?? project.lastAudit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    'No audits yet.'
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
