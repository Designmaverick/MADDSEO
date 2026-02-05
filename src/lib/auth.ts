import type { PrismaClient } from '@prisma/client';
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';
import { getPrisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function getAuthOptions(existingPrisma?: PrismaClient): Promise<NextAuthOptions> {
  const prisma = existingPrisma ?? (await getPrisma());
  if (!prisma) {
    throw new Error('Prisma is not available during build.');
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers: [
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET
            })
          ]
        : []),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash) return null;
          if (user.status === 'DISABLED') return null;

          const ok = await verifyPassword(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        }
      })
    ],
    session: {
      strategy: 'database'
    },
    pages: {
      signIn: '/sign-in'
    },
    callbacks: {
      async signIn({ user }) {
        if (!user?.email) return false;
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser && dbUser.status === 'DISABLED') return false;
        if (!dbUser) {
          const systemSettings = await prisma.systemSettings.findFirst();
          if (systemSettings && systemSettings.allowSignup === false) return false;
        }
        return true;
      },
      async session({ session, user }) {
        if (session.user && user) {
          session.user.id = user.id;
          session.user.role = user.role;
          session.user.isPro = user.isPro;
          session.user.status = user.status;
        }
        return session;
      }
    }
  };
}

