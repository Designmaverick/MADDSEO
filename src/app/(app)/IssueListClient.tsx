'use client';

import { useMemo, useState } from 'react';

export type IssueItem = {
  id: string;
  title: string;
  description: string;
  fix: string;
  severity: string;
  category: string;
  group: string;
  pageUrl: string | null;
};

type Props = {
  issues: IssueItem[];
};

const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function IssueListClient({ issues }: Props) {
  const [severity, setSeverity] = useState('ALL');
  const [pageFilter, setPageFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const pages = useMemo(() => {
    const unique = new Set<string>();
    issues.forEach((issue) => {
      if (issue.pageUrl) unique.add(issue.pageUrl);
    });
    return ['ALL', ...Array.from(unique).slice(0, 50)];
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (severity !== 'ALL' && issue.severity !== severity) return false;
      if (pageFilter !== 'ALL' && issue.pageUrl !== pageFilter) return false;
      if (search) {
        const needle = search.toLowerCase();
        const haystack = `${issue.title} ${issue.description} ${issue.fix}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [issues, severity, pageFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, IssueItem[]>();
    filtered.forEach((issue) => {
      const bucket = map.get(issue.group) ?? [];
      bucket.push(issue);
      map.set(issue.group, bucket);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs text-slate-500">Severity</label>
          <select className="input mt-1" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {severities.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Page</label>
          <select className="input mt-1" value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
            {pages.map((page) => (
              <option key={page} value={page}>{page}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Search</label>
          <input className="input mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issues" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No issues match the selected filters.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([group, groupIssues]) => (
            <div key={group} className="space-y-3">
              <h2 className="text-lg font-semibold">{group}</h2>
              <div className="grid gap-4">
                {groupIssues.map((issue) => (
                  <div key={issue.id} className="card p-5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base font-semibold">{issue.title}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-400">{issue.severity}</span>
                    </div>
                    <p className="text-sm text-slate-500">{issue.description}</p>
                    <div className="text-sm text-slate-400">
                      <span className="font-medium text-slate-200">How to fix:</span> {issue.fix}
                    </div>
                    <div className="text-xs text-slate-500">
                      Affected URL: {issue.pageUrl ?? 'Site-wide'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
