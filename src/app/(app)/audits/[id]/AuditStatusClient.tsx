'use client';

import { useState } from 'react';

type Props = {
  auditId: string;
  status: string;
  lastError: string | null;
};

export default function AuditStatusClient({ auditId, status, lastError }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/audits/${auditId}/retry`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || 'Unable to retry.');
    } else {
      setMessage('Audit queued again.');
    }
    setLoading(false);
  }

  if (status !== 'FAILED') {
    return null;
  }

  return (
    <div className="space-y-2">
      {lastError && <p className="text-sm text-red-200">{lastError}</p>}
      <button className="button" onClick={handleRetry} disabled={loading}>
        {loading ? 'Retrying...' : 'Retry Audit'}
      </button>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
