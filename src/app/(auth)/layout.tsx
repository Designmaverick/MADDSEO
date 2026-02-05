export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-accent" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Cascade</p>
              <h1 className="text-3xl font-semibold">SEO Audit Platform</h1>
            </div>
          </div>
          <p className="text-lg text-slate-500 max-w-xl">
            Run fast, focused audits. Track fixes, surface critical issues, and ship client-ready reports without the clutter.
          </p>
          <div className="grid gap-4">
            <div className="card p-4">
              <p className="text-sm font-semibold">Phase 1: Auth + Schema</p>
              <p className="text-sm text-slate-500">Invite-only control, credential and Google sign-in, and strict plan limits.</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-semibold">Built for agencies</p>
              <p className="text-sm text-slate-500">White-label reporting and pro upgrades managed manually by Super Admin.</p>
            </div>
          </div>
        </div>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
