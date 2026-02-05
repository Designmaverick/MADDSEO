'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProjectOption = {
  id: string;
  name: string;
  domain: string;
};

type Props = {
  projects: ProjectOption[];
  isPro: boolean;
  auditsThisWeek: number;
  projectCount: number;
};

const freeLimits = { maxProjects: 1, maxAuditsPerWeek: 1, maxPages: 10, maxDepth: 2 };
const proLimits = { maxProjects: Infinity, maxAuditsPerWeek: Infinity, maxPages: 100, maxDepth: 3 };

export default function NewAuditClient({ projects, isPro, auditsThisWeek, projectCount }: Props) {
  const router = useRouter();
  const limits = isPro ? proLimits : freeLimits;
  const [mode, setMode] = useState(projects.length ? 'existing' : 'new');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [depth, setDepth] = useState(limits.maxDepth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const estimate = useMemo(() => {
    if (depth <= 1) return '2-4 minutes';
    if (depth === 2) return '5-8 minutes';
    return '10-15 minutes';
  }, [depth]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const atProjectLimit = !isPro && projectCount >= limits.maxProjects && mode === 'new';
  const atAuditLimit = !isPro && auditsThisWeek >= limits.maxAuditsPerWeek;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload =
      mode === 'existing'
        ? { projectId, depth }
        : { projectName: name, domain, depth };

    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to start audit.');
      setLoading(false);
      return;
    }

    router.push(`/audits/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New Audit</h1>
        <p className="text-slate-500">Select a project, depth, and start the crawl.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6 space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Project Selection</h2>
            <p className="text-sm text-slate-500">Choose an existing domain or add a new one.</p>
          </div>

          <div className="flex gap-3 text-sm text-slate-500">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
                disabled={projects.length === 0}
              />
              Existing project
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'new'} onChange={() => setMode('new')} />
              New project
            </label>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-3">
              <select
                className="input"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.domain})
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500">
                Domain: {selectedProject?.domain ?? '—'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className="input"
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <input
                className="input"
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Depth</h3>
            <select
              className="input"
              value={depth}
              onChange={(event) => setDepth(Number(event.target.value))}
              disabled={!isPro}
            >
              <option value={1}>Depth 1 (shallow)</option>
              <option value={2}>Depth 2 (recommended)</option>
              <option value={3} disabled={!isPro}>
                Depth 3 (Pro only)
              </option>
            </select>
            {!isPro && <p className="text-xs text-slate-500">Upgrade to unlock deeper crawls.</p>}
          </div>

          <button type="submit" className="button" disabled={loading || atAuditLimit || atProjectLimit}>
            {loading ? 'Starting audit...' : 'Start audit'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="card p-5 space-y-2">
            <h3 className="text-lg font-semibold">Limits & Warnings</h3>
            <p className="text-sm text-slate-500">
              {isPro
                ? 'Pro plan unlocks unlimited domains and audits.'
                : `Free plan: ${projectCount}/${limits.maxProjects} domains, ${auditsThisWeek}/${limits.maxAuditsPerWeek} audits this week.`}
            </p>
            {!isPro && (atProjectLimit || atAuditLimit) && (
              <p className="text-xs text-red-200">
                {atProjectLimit ? 'Domain limit reached.' : 'Weekly audit limit reached.'}
              </p>
            )}
            <p className="text-xs text-slate-500">Max pages per audit: {limits.maxPages}</p>
          </div>

          <div className="card p-5 space-y-2">
            <h3 className="text-lg font-semibold">Estimate</h3>
            <p className="text-sm text-slate-500">Estimated time: {estimate}</p>
            <p className="text-xs text-slate-500">Page cap: {limits.maxPages} pages</p>
          </div>
        </div>
      </form>
    </div>
  );
}
