'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function NewAuditPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, domain })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to create audit.');
      setLoading(false);
      return;
    }

    router.push('/audits');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New Audit</h1>
        <p className="text-slate-500">Start a fresh crawl and PageSpeed scan.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-xl">
        <label className="block text-sm">
          Project name
          <input
            className="input mt-1"
            type="text"
            placeholder="Client domain name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Domain
          <input
            className="input mt-1"
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Creating audit...' : 'Create audit'}
        </button>
      </form>
    </div>
  );
}
