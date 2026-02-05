'use client';

import { useMemo, useState } from 'react';

type AuditRow = {
  id: string;
  domain: string;
  status: string;
  scoreOverall: number | null;
  createdAt: string;
};

type Props = {
  audits: AuditRow[];
};

export default function HistoryClient({ audits }: Props) {
  const [query, setQuery] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return audits.filter((audit) => {
      if (query) {
        const needle = query.toLowerCase();
        if (!audit.domain.toLowerCase().includes(needle)) return false;
      }
      if (minScore) {
        const min = Number(minScore);
        if (Number.isFinite(min) && (audit.scoreOverall ?? 0) < min) return false;
      }
      if (maxScore) {
        const max = Number(maxScore);
        if (Number.isFinite(max) && (audit.scoreOverall ?? 0) > max) return false;
      }
      return true;
    });
  }, [audits, query, minScore, maxScore]);

  const selectedAudits = audits.filter((audit) => selected.includes(audit.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <input className="input" placeholder="Filter by domain" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="input" placeholder="Min score" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        <input className="input" placeholder="Max score" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
      </div>

      {selectedAudits.length === 2 && (
        <div className="card p-5 space-y-2">
          <h3 className="text-lg font-semibold">Comparison</h3>
          <p className="text-sm text-slate-500">
            {selectedAudits[0].domain} vs {selectedAudits[1].domain}
          </p>
          <div className="text-sm text-slate-400">
            Score change: {(selectedAudits[1].scoreOverall ?? 0) - (selectedAudits[0].scoreOverall ?? 0)}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-6 text-sm text-slate-500">No audits match the filters.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((audit) => (
            <div key={audit.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500">{new Date(audit.createdAt).toLocaleDateString()}</p>
                <h3 className="text-lg font-semibold">{audit.domain}</h3>
                <p className="text-xs text-slate-500">Status: {audit.status}</p>
              </div>
              <div className="text-sm text-slate-500">Score: {audit.scoreOverall ?? '—'}</div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" checked={selected.includes(audit.id)} onChange={() => toggleSelect(audit.id)} />
                Compare
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
