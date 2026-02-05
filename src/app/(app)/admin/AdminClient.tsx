'use client';

import { useMemo, useState } from 'react';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  isPro: boolean;
  createdAt: string;
};

type InviteRow = {
  id: string;
  token: string;
  email: string | null;
  role: string;
  isPro: boolean;
  expiresAt: string;
  usedAt: string | null;
};

type Props = {
  initialUsers: UserRow[];
  initialInvites: InviteRow[];
};

export default function AdminClient({ initialUsers, initialInvites }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [invites, setInvites] = useState<InviteRow[]>(initialInvites);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = users.length;
    const pro = users.filter((u) => u.isPro).length;
    const disabled = users.filter((u) => u.status === 'DISABLED').length;
    return { total, pro, disabled };
  }, [users]);

  async function refreshUsers() {
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function handleTogglePro(user: UserRow) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: !user.isPro })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to update user.');
    } else {
      await refreshUsers();
    }
    setLoading(false);
  }

  async function handleToggleStatus(user: UserRow) {
    setLoading(true);
    setError(null);
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to update user.');
    } else {
      await refreshUsers();
    }
    setLoading(false);
  }

  async function handleResetPassword(user: UserRow) {
    const nextPassword = window.prompt(`Set a new password for ${user.email}:`);
    if (!nextPassword) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nextPassword })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to reset password.');
    } else {
      setMessage('Password updated.');
      await refreshUsers();
    }
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim() || undefined,
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || '').trim() || undefined,
      role: String(form.get('role') || 'USER'),
      isPro: form.get('isPro') === 'on'
    };

    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to create user.');
    } else {
      setMessage(data.tempPassword ? `User created. Temp password: ${data.tempPassword}` : 'User created.');
      await refreshUsers();
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  async function handleCreateInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get('inviteEmail') || '').trim() || undefined,
      role: String(form.get('inviteRole') || 'USER'),
      isPro: form.get('inviteIsPro') === 'on',
      expiresInDays: Number(form.get('expiresInDays') || 7)
    };

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Unable to create invite.');
    } else {
      setMessage(`Invite created: ${data.token}`);
      setInvites((prev) => [
        {
          id: crypto.randomUUID(),
          token: data.token,
          email: data.email ?? null,
          role: data.role,
          isPro: data.isPro,
          expiresAt: data.expiresAt,
          usedAt: null
        },
        ...prev
      ]);
      e.currentTarget.reset();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Super Admin</h1>
          <p className="text-slate-500">Manage users, plans, invites, and account access.</p>
        </div>
        <div className="text-xs text-slate-500">
          {loading ? 'Processing...' : 'Ready'}
        </div>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total users</p>
          <p className="text-3xl font-semibold">{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Pro users</p>
          <p className="text-3xl font-semibold">{stats.pro}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Disabled</p>
          <p className="text-3xl font-semibold">{stats.disabled}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleCreateUser} className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Create User</h2>
            <p className="text-sm text-slate-500">Manually provision a user with a password.</p>
          </div>
          <div className="grid gap-3">
            <input name="name" className="input" placeholder="Full name" />
            <input name="email" className="input" placeholder="Email" required />
            <input name="password" className="input" placeholder="Temp password" />
            <div className="flex gap-3 text-sm text-slate-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isPro" />
                Pro access
              </label>
              <label className="flex items-center gap-2">
                <select name="role" className="input">
                  <option value="USER">User</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </label>
            </div>
          </div>
          <button type="submit" className="button" disabled={loading}>
            Create user
          </button>
        </form>

        <form onSubmit={handleCreateInvite} className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Generate Invite</h2>
            <p className="text-sm text-slate-500">Create time-limited invite links.</p>
          </div>
          <div className="grid gap-3">
            <input name="inviteEmail" className="input" placeholder="Limit to email (optional)" />
            <div className="flex gap-3 text-sm text-slate-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="inviteIsPro" />
                Pro access
              </label>
              <label className="flex items-center gap-2">
                <select name="inviteRole" className="input">
                  <option value="USER">User</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </label>
              <input name="expiresInDays" className="input w-24" type="number" defaultValue={7} min={1} max={30} />
            </div>
          </div>
          <button type="submit" className="button" disabled={loading}>
            Create invite
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Users</h2>
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Plan</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Created</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="p-2">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-xs text-slate-500">{user.name || '?'}</div>
                  </td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.isPro ? 'PRO' : 'FREE'}</td>
                  <td className="p-2">{user.status}</td>
                  <td className="p-2 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-right space-x-2">
                    <button className="px-3 py-1 rounded-lg border border-white/10" onClick={() => handleTogglePro(user)}>
                      Toggle Pro
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-white/10" onClick={() => handleToggleStatus(user)}>
                      {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-white/10" onClick={() => handleResetPassword(user)}>
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Invites</h2>
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left p-2">Token</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Plan</th>
                <th className="text-left p-2">Expires</th>
                <th className="text-left p-2">Used</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t border-white/5">
                  <td className="p-2 font-mono text-xs break-all">{invite.token}</td>
                  <td className="p-2">{invite.email || '?'}</td>
                  <td className="p-2">{invite.role}</td>
                  <td className="p-2">{invite.isPro ? 'PRO' : 'FREE'}</td>
                  <td className="p-2 text-slate-500">{new Date(invite.expiresAt).toLocaleDateString()}</td>
                  <td className="p-2 text-slate-500">{invite.usedAt ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
