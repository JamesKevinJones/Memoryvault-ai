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
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const ws = await ensureWorkspace(user.id);
        session.user.workspaceId = ws.workspaceId;
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
