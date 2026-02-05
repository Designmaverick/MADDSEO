'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const nextAuthError = searchParams.get('error');

  useEffect(() => {
    getProviders().then((providers) => {
      setGoogleEnabled(Boolean(providers?.google));
    });
  }, []);

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    if (res?.error) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h2 className="text-2xl font-semibold">Sign in to your workspace</h2>
      </div>

      {nextAuthError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          Unable to sign you in. Please try again or use credentials.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      {googleEnabled && (
        <>
          <button type="button" onClick={handleGoogle} className="button w-full" disabled={loading}>
            Continue with Google
          </button>
          <div className="text-xs uppercase tracking-[0.4em] text-slate-500">Or</div>
        </>
      )}

      <form onSubmit={handleCredentials} className="space-y-4">
        <label className="block text-sm">
          Email
          <input
            className="input mt-1"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="input mt-1"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-slate-500">
        New here? <Link className="text-accent font-semibold" href="/sign-up">Create an account</Link>
      </p>
    </div>
  );
}
