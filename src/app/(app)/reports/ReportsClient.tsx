'use client';

import { useState } from 'react';

type ReportRow = {
  id: string;
  type: string;
  status: string;
  fileUrl: string | null;
  whiteLabel: boolean;
  createdAt: string;
  auditDomain: string;
};

type Props = {
  initialReports: ReportRow[];
};

export default function ReportsClient({ initialReports }: Props) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(reportId: string) {
    if (!window.confirm('Delete this report?')) return;
    const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to delete report.');
      return;
    }
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }

  if (reports.length === 0) {
    return <div className="card p-6 text-sm text-slate-500">No reports generated yet.</div>;
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-500">{report.auditDomain}</p>
              <h2 className="text-lg font-semibold">{report.type} Report</h2>
              <p className="text-xs text-slate-500">Status: {report.status}</p>
            </div>
            <div className="text-sm text-slate-500">White label: {report.whiteLabel ? 'Yes' : 'No'}</div>
            <div className="flex gap-2 text-sm">
              {report.fileUrl ? (
                <a className="px-3 py-1 rounded-lg border border-white/10" href={report.fileUrl} target="_blank" rel="noreferrer">
                  Download
                </a>
              ) : (
                <span className="px-3 py-1 rounded-lg border border-white/10 text-slate-500">Not ready</span>
              )}
              <button className="px-3 py-1 rounded-lg border border-white/10" onClick={() => handleDelete(report.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
