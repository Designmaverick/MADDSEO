import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function TechnicalPage() {
  const session = await getServerSession(authOptions);
  const count = await prisma.issue.count({
    where: { audit: { runnerId: session?.user.id }, category: 'TECHNICAL' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Technical Issues</h1>
        <p className="text-slate-500">Monitor HTTPS, indexability, and crawl health.</p>
      </div>
      <div className="card p-6">
        <p className="text-sm text-slate-500">Total technical issues</p>
        <p className="text-3xl font-semibold">{count}</p>
      </div>
    </div>
  );
}
