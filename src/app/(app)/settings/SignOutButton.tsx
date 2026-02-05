'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button type="button" className="px-4 py-2 rounded-xl border border-white/10" onClick={() => signOut()}>
      Sign out
    </button>
  );
}
