'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

type SettingsData = {
  companyName: string | null;
  companyUrl: string | null;
  logoUrl: string | null;
  whiteLabelDefault: boolean;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;
  notificationAuditComplete: boolean;
  notificationWeeklyDigest: boolean;
  notificationMarketing: boolean;
  apiKeyLastFour: string | null;
  apiKeyCreatedAt: string | null;
};

type Props = {
  userName: string | null;
  userEmail: string;
  isPro: boolean;
  role: string;
  status: string;
  hasGoogle: boolean;
  settings: SettingsData;
};

export default function SettingsClient({
  userName,
  userEmail,
  isPro,
  role,
  status,
  hasGoogle,
  settings
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState(userName ?? '');
  const [companyName, setCompanyName] = useState(settings.companyName ?? '');
  const [companyUrl, setCompanyUrl] = useState(settings.companyUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? '');
  const [whiteLabelDefault, setWhiteLabelDefault] = useState(settings.whiteLabelDefault ?? false);
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(settings.brandPrimaryColor ?? '#9a28c5');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(settings.brandSecondaryColor ?? '#6c2bd9');
  const [notificationAuditComplete, setNotificationAuditComplete] = useState(
    settings.notificationAuditComplete ?? true
  );
  const [notificationWeeklyDigest, setNotificationWeeklyDigest] = useState(
    settings.notificationWeeklyDigest ?? false
  );
  const [notificationMarketing, setNotificationMarketing] = useState(settings.notificationMarketing ?? false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null);

  async function saveSettings() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const brandingPayload: Record<string, unknown> = {
      companyName,
      companyUrl,
      logoUrl
    };
    if (isPro) {
      brandingPayload.whiteLabelDefault = whiteLabelDefault;
      brandingPayload.brandPrimaryColor = brandPrimaryColor;
      brandingPayload.brandSecondaryColor = brandSecondaryColor;
    }

    const profilePayload = profileName.trim().length >= 2 ? { name: profileName.trim() } : {};

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: profilePayload,
        branding: brandingPayload,
        notifications: {
          notificationAuditComplete,
          notificationWeeklyDigest,
          notificationMarketing
        }
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to update settings.');
    } else {
      setMessage('Settings updated.');
    }
    setLoading(false);
  }

  async function updatePassword() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to update password.');
    } else {
      setMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    }
    setLoading(false);
  }

  async function generateApiKey() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/settings/api-key', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to generate API key.');
    } else {
      setApiKeyValue(data.apiKey);
      setMessage('API key generated. Copy it now; it will not be shown again.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            error ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="grid gap-3 text-sm text-slate-500">
          <div>Email: {userEmail}</div>
          <div>Role: {role}</div>
          <div>Status: {status}</div>
          <div>Plan: {isPro ? 'PRO' : 'FREE'}</div>
        </div>
        <div className="grid gap-3 max-w-md">
          <label className="text-sm text-slate-500">Display name</label>
          <input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
        </div>
        <button className="button" onClick={saveSettings} disabled={loading}>
          Save profile
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <div className="text-sm text-slate-500">
          Google: {hasGoogle ? 'Connected' : 'Not connected'}
        </div>
        {!hasGoogle && (
          <button className="px-4 py-2 rounded-xl border border-white/10" onClick={() => signIn('google')}>
            Connect Google
          </button>
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Branding</h2>
        {!isPro && (
          <p className="text-sm text-slate-500">Branding and white-label options are available on Pro.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input className="input" placeholder="Company URL" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
          <input className="input" placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={whiteLabelDefault} onChange={(e) => setWhiteLabelDefault(e.target.checked)} disabled={!isPro} />
            White-label by default
          </label>
          <label className="text-sm text-slate-500">
            Primary color
            <input className="input mt-1" value={brandPrimaryColor} onChange={(e) => setBrandPrimaryColor(e.target.value)} disabled={!isPro} />
          </label>
          <label className="text-sm text-slate-500">
            Secondary color
            <input className="input mt-1" value={brandSecondaryColor} onChange={(e) => setBrandSecondaryColor(e.target.value)} disabled={!isPro} />
          </label>
        </div>
        <button className="button" onClick={saveSettings} disabled={loading}>
          Save branding
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="grid gap-2 text-sm text-slate-500">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notificationAuditComplete} onChange={(e) => setNotificationAuditComplete(e.target.checked)} />
            Audit completion alerts
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notificationWeeklyDigest} onChange={(e) => setNotificationWeeklyDigest(e.target.checked)} />
            Weekly digest
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notificationMarketing} onChange={(e) => setNotificationMarketing(e.target.checked)} />
            Product updates
          </label>
        </div>
        <button className="button" onClick={saveSettings} disabled={loading}>
          Save notifications
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Password</h2>
        <div className="grid gap-3 max-w-md">
          <input
            className="input"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <button className="button" onClick={updatePassword} disabled={loading}>
          Update password
        </button>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <div className="text-sm text-slate-500">
          {settings.apiKeyLastFour ? `Active key ending in ${settings.apiKeyLastFour}` : 'No API key created yet.'}
        </div>
        <button className="button" onClick={generateApiKey} disabled={loading}>
          Generate API key
        </button>
        {apiKeyValue && (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
            {apiKeyValue}
          </div>
        )}
      </section>
    </div>
  );
}
