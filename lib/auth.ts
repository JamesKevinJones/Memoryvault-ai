import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { env } from "@/lib/env";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

/**
 * JWT sessions (not DB sessions) so Next.js Edge middleware can read auth
 * without opening a Cockroach/postgres TCP connection (unsupported on Edge).
 * Adapter still persists users + OAuth accounts in CockroachDB.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: env().AUTH_GOOGLE_ID,
      clientSecret: env().AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const ws = await ensureWorkspace(user.id);
        token.workspaceId = ws.workspaceId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.workspaceId = (token.workspaceId as string) ?? "";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) await ensureWorkspace(user.id);
    },
  },
  trustHost: true,
});
