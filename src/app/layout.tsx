import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/app/providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display'
});

export const metadata: Metadata = {
  title: 'Cascade SEO Audit Platform',
  description: 'SaaS SEO audits built for agencies and freelancers.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
