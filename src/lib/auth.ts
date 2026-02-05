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
          image: user.image,
          role: user.role,
          isPro: user.isPro,
          status: user.status
        };
        }
      })
    ],
    session: {
      strategy: 'jwt'
    },
    pages: {
      signIn: '/sign-in'
    },
    callbacks: {
      async jwt({ token, user }) {
        const now = Date.now();
        if (user) {
          const typedUser = user as typeof user & {
            role?: string;
            isPro?: boolean;
            status?: string;
          };
          if (typedUser.role) {
            token.id = user.id;
            token.role = typedUser.role as any;
            token.isPro = Boolean(typedUser.isPro);
            token.status = typedUser.status as any;
          } else if (user.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email }
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.isPro = dbUser.isPro;
              token.status = dbUser.status;
            } else {
              token.id = user.id;
            }
          }
          token.lastSync = now;
        } else if (token.id && (!token.lastSync || now - Number(token.lastSync) > 5 * 60 * 1000)) {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isPro = dbUser.isPro;
            token.status = dbUser.status;
          }
          token.lastSync = now;
        }
        return token;
      },
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
      async session({ session, token }) {
        if (session.user) {
          session.user.id = (token.id as string) ?? '';
          session.user.role = (token.role as any) ?? 'USER';
          session.user.isPro = Boolean(token.isPro);
          session.user.status = (token.status as any) ?? 'ACTIVE';
        }
        return session;
      }
    }
  };
}
