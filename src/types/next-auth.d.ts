import NextAuth from 'next-auth';
import { Role, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      isPro: boolean;
      status: UserStatus;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
