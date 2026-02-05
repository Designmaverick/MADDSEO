'use client';

import { signOut } from 'next-auth/react';

type Props = {
  className?: string;
  label?: string;
};

export default function SignOutButton({ className, label = 'Sign out' }: Props) {
  return (
    <button
      type="button"
      className={className ?? 'px-4 py-2 rounded-xl border border-white/10'}
      onClick={() => signOut()}
    >
      {label}
    </button>
  );
}
