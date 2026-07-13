# MemoryVault AI — M0 Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a signed-in empty product shell with Auth.js, CockroachDB-backed users/sessions/workspaces (1:1), health/me/workspace APIs, Docker, and customized design tokens — no AI, no memories yet.

**Architecture:** Thin Next.js 15 App Router shell; feature-first folders stubbed for auth; Drizzle + CockroachDB for persistence; Auth.js (NextAuth v5) with Drizzle adapter and Google OAuth; workspace auto-created on first `/api/v1/me` or sign-in callback.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4 (or v3 if create-next-app defaults require), shadcn/ui, Auth.js v5, Drizzle ORM, `postgres` driver, CockroachDB, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-07-13-memoryvault-ai-design.md` (Milestone 0)

## Global Constraints

- No application features beyond M0 exit criteria (no Bedrock, memories, chat, vectors).
- Prefer Server Components; client only for sidebar collapse / user menu if needed.
- No Framer Motion in M0.
- Custom design tokens (refined neutrals) — never ship default shadcn purple look.
- Auth.js stays at `/api/auth/[...nextauth]`; product APIs under `/api/v1/*`.
- Workspace ↔ user is 1:1; create workspace when user is first created.
- YAGNI: no `services/`, no cache, no workers.
- Every task ends with a commit unless the user forbids commits mid-run.
- Do not commit `.env` files with secrets.

---

## File map (M0)

| Path | Responsibility |
|------|----------------|
| `package.json` | Dependencies & scripts |
| `docker-compose.yml` | Local CockroachDB |
| `Dockerfile` | App image (dev-friendly multi-stage later OK) |
| `.env.example` | Documented env vars (no secrets) |
| `drizzle.config.ts` | Drizzle Kit config |
| `db/client.ts` | DB connection singleton |
| `db/schema/auth.ts` | users, accounts, sessions, verification_tokens |
| `db/schema/workspaces.ts` | workspaces + user.workspaceId relation |
| `db/schema/index.ts` | Re-exports |
| `lib/env.ts` | Zod-validated env |
| `lib/auth.ts` | Auth.js config |
| `lib/auth-types.ts` | Session type extensions |
| `middleware.ts` | Protect `(app)` routes |
| `features/auth/use-cases/ensure-workspace.ts` | 1:1 workspace bootstrap |
| `features/auth/api/me.ts` | Handler logic for GET /me |
| `features/auth/api/workspace.ts` | Handler logic for workspace GET/PATCH |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js route |
| `app/api/v1/health/route.ts` | Health check |
| `app/api/v1/me/route.ts` | Thin adapter |
| `app/api/v1/workspace/route.ts` | Thin adapter |
| `app/(auth)/sign-in/page.tsx` | Sign-in UI |
| `app/(app)/layout.tsx` | Authenticated shell |
| `app/(app)/dashboard/page.tsx` | Empty dashboard |
| `components/layout/app-shell.tsx` | Shell composition |
| `components/layout/sidebar.tsx` | Nav |
| `components/layout/top-bar.tsx` | Top bar |
| `components/ui/*` | shadcn primitives (button, etc.) |
| `app/globals.css` | Tokens + base styles |
| `tests/health.test.ts` | Health route test (or vitest) |

---

### Task 1: Scaffold Next.js app + tooling

**Files:**
- Create: project root via `create-next-app`
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` scripts

**Interfaces:**
- Consumes: none
- Produces: runnable Next.js 15 + TS + Tailwind + App Router project

- [ ] **Step 1: Scaffold**

If the repo only has `README.md` and `docs/`, scaffold in place:

```bash
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

If create-next-app refuses non-empty dir, scaffold into a temp folder and move files up (keep `docs/` and `README.md`).

- [ ] **Step 2: Add M0 dependencies**

```bash
npm install next-auth@5 drizzle-orm postgres zod
npm install -D drizzle-kit vitest @vitejs/plugin-react jsdom @types/node
```

Note: use the current Auth.js v5 package name published as `next-auth@beta` or `next-auth@5` — pin whatever `npm view next-auth version` resolves to that is v5.

- [ ] **Step 3: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 4: Add `vitest.config.ts`**

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 5: Verify scaffold**

```bash
npm run build
```

Expected: Next.js build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with tooling for M0"
```

---

### Task 2: Design tokens + shadcn base (custom neutrals)

**Files:**
- Create: `components.json`
- Create: `components/ui/button.tsx` (via shadcn)
- Create: `lib/utils.ts`
- Modify: `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Consumes: Tailwind setup from Task 1
- Produces: `cn()` helper; CSS variables for refined neutral theme; Button primitive

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init -y -b neutral
```

Then override theme in `app/globals.css` to refined neutrals (warm stone/ink — not purple, not cream+terracotta cliché). Example token block:

```css
:root {
  --background: 40 20% 98%;
  --foreground: 24 10% 10%;
  --card: 0 0% 100%;
  --card-foreground: 24 10% 10%;
  --primary: 24 10% 12%;
  --primary-foreground: 40 20% 98%;
  --secondary: 30 10% 94%;
  --secondary-foreground: 24 10% 12%;
  --muted: 30 8% 94%;
  --muted-foreground: 25 5% 42%;
  --accent: 30 10% 94%;
  --accent-foreground: 24 10% 12%;
  --border: 30 10% 90%;
  --ring: 24 10% 12%;
  --radius: 0.875rem; /* ~14px within 12–18px */
}
```

Use a distinctive font pair via `next/font` in `app/layout.tsx` (e.g. `Geist` is OK if already default; prefer something intentional like `Newsreader` + `Geist Sans` or `IBM Plex Sans` — pick one and stick to it). Avoid Inter/Roboto/Arial as the primary brand face.

- [ ] **Step 2: Add Button**

```bash
npx shadcn@latest add button
```

- [ ] **Step 3: Update root layout metadata**

```tsx
export const metadata = {
  title: "MemoryVault AI",
  description: "Persistent memory for agents",
};
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: add custom neutral design tokens and shadcn button"
```

---

### Task 3: Env validation + Docker Compose (CockroachDB)

**Files:**
- Create: `.env.example`
- Create: `lib/env.ts`
- Create: `docker-compose.yml`
- Create: `Dockerfile`

**Interfaces:**
- Consumes: none
- Produces: `env` object with typed config; local DB on `localhost:26257`

- [ ] **Step 1: Write failing test for env schema**

Create `tests/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("env", () => {
  it("requires DATABASE_URL", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { loadEnv } = await import("@/lib/env");
      expect(() => loadEnv({ ...process.env, DATABASE_URL: undefined })).toThrow();
    } finally {
      if (prev !== undefined) process.env.DATABASE_URL = prev;
    }
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
npm test -- tests/env.test.ts
```

Expected: FAIL (module missing)

- [ ] **Step 3: Implement `lib/env.ts`**

```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Lazy singleton for server runtime */
let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}
```

- [ ] **Step 4: `.env.example`**

```env
DATABASE_URL=postgresql://root@localhost:26257/memoryvault?sslmode=disable
AUTH_SECRET=generate-a-long-random-string
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_URL=http://localhost:3000
```

- [ ] **Step 5: `docker-compose.yml`**

```yaml
services:
  cockroach:
    image: cockroachdb/cockroach:latest-v24.3
    command: start-single-node --insecure --http-addr=0.0.0.0:8080
    ports:
      - "26257:26257"
      - "8080:8080"
    volumes:
      - crdb_data:/cockroach/cockroach-data

volumes:
  crdb_data:
```

- [ ] **Step 6: Minimal `Dockerfile`**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

- [ ] **Step 7: Start DB + create database**

```bash
docker compose up -d
docker compose exec cockroach ./cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS memoryvault;"
```

- [ ] **Step 8: Re-run env test (adjust if needed for dynamic import cache)**

```bash
npm test -- tests/env.test.ts
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml Dockerfile .env.example lib/env.ts tests/env.test.ts
git commit -m "chore: add env validation and local CockroachDB compose"
```

---

### Task 4: Drizzle schema — users, auth tables, workspaces

**Files:**
- Create: `drizzle.config.ts`
- Create: `db/client.ts`
- Create: `db/schema/auth.ts`
- Create: `db/schema/workspaces.ts`
- Create: `db/schema/index.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` via `env()`
- Produces: `db` client; tables `users`, `accounts`, `sessions`, `verification_tokens`, `workspaces`

- [ ] **Step 1: `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: `db/schema/workspaces.ts`**

```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 3: `db/schema/auth.ts`**

Auth.js Drizzle adapter shape (text IDs):

```ts
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
```

**Important:** Auth.js adapter expects to insert `users` without `workspaceId`. Handle workspace creation in `events.createUser` (Task 5) **or** make `workspaceId` nullable initially and backfill — preferred approach for M0:

Make `workspaceId` **nullable** in schema, then `ensureWorkspace` sets it. Document this in code comments. Update schema:

```ts
workspaceId: text("workspace_id").references(() => workspaces.id, {
  onDelete: "restrict",
}),
```

- [ ] **Step 4: `db/schema/index.ts`**

```ts
export * from "./workspaces";
export * from "./auth";
```

- [ ] **Step 5: `db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const client = postgres(env().DATABASE_URL, { max: 10, prepare: false });
export const db = drizzle(client, { schema });
```

CockroachDB: `prepare: false` avoids issues with prepared statements in some setups.

- [ ] **Step 6: Push schema**

```bash
# ensure .env exists with DATABASE_URL
npm run db:push
```

Expected: tables created in `memoryvault`.

- [ ] **Step 7: Commit**

```bash
git add db drizzle.config.ts
git commit -m "feat: add Drizzle schema for auth and workspaces"
```

---

### Task 5: Auth.js + ensureWorkspace

**Files:**
- Create: `lib/auth.ts`
- Create: `types/next-auth.d.ts`
- Create: `features/auth/use-cases/ensure-workspace.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `db`, schema tables, `env()`
- Produces:
  - `auth`, `handlers`, `signIn`, `signOut` from Auth.js
  - `ensureWorkspace(userId: string): Promise<{ workspaceId: string; name: string }>`

- [ ] **Step 1: Write failing unit test for ensureWorkspace id shape**

`tests/ensure-workspace.test.ts` — prefer testing pure id/name helpers if DB not available in CI; for M0, test that the use-case function exists and returns workspace fields when db is mocked, **or** skip DB test and add an integration note.

Minimal pure helper in the same file:

```ts
// features/auth/use-cases/ensure-workspace.ts
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, workspaces } from "@/db/schema";
import { randomUUID } from "node:crypto";

export async function ensureWorkspace(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  if (user.workspaceId) {
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, user.workspaceId))
      .limit(1);
    if (!ws) throw new Error("Workspace missing");
    return { workspaceId: ws.id, name: ws.name };
  }

  const workspaceId = randomUUID();
  const name = user.name ? `${user.name}'s Vault` : "My Vault";

  await db.insert(workspaces).values({ id: workspaceId, name });
  await db
    .update(users)
    .set({ workspaceId, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { workspaceId, name };
}
```

- [ ] **Step 2: `lib/auth.ts`**

```ts
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
```

Install adapter:

```bash
npm install @auth/drizzle-adapter
```

- [ ] **Step 3: Session types `types/next-auth.d.ts`**

```ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 4: Auth route**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 5: Middleware**

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isApp = req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/chat") ||
    req.nextUrl.pathname.startsWith("/projects") ||
    req.nextUrl.pathname.startsWith("/tasks") ||
    req.nextUrl.pathname.startsWith("/documents") ||
    req.nextUrl.pathname.startsWith("/settings");
  if (isApp && !req.auth) {
    const url = new URL("/sign-in", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/documents/:path*",
    "/settings/:path*",
  ],
};
```

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts types features/auth app/api/auth middleware.ts package.json package-lock.json
git commit -m "feat: add Auth.js with Google OAuth and workspace bootstrap"
```

---

### Task 6: `/api/v1/health`, `/api/v1/me`, `/api/v1/workspace`

**Files:**
- Create: `app/api/v1/health/route.ts`
- Create: `app/api/v1/me/route.ts`
- Create: `app/api/v1/workspace/route.ts`
- Create: `features/auth/api/get-me.ts`
- Create: `features/auth/api/workspace-handlers.ts`
- Create: `tests/health.test.ts`

**Interfaces:**
- Consumes: `auth()`, `db`, `ensureWorkspace`
- Produces:
  - `GET /api/v1/health` → `{ status: "ok", db: "up"|"down" }`
  - `GET /api/v1/me` → user + workspaceId (401 if unauthenticated)
  - `GET /api/v1/workspace` → `{ id, name }`
  - `PATCH /api/v1/workspace` → `{ id, name }` body `{ name: string }`

- [ ] **Step 1: Failing health test**

```ts
import { describe, expect, it } from "vitest";

describe("GET /api/v1/health", () => {
  it("returns ok payload shape from handler export", async () => {
    const { GET } = await import("@/app/api/v1/health/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(["ok", "degraded"]).toContain(body.status);
  });
});
```

- [ ] **Step 2: Implement health route**

```ts
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok", db: "up" });
  } catch {
    return Response.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
```

- [ ] **Step 3: Implement me + workspace handlers**

```ts
// features/auth/api/get-me.ts
import { auth } from "@/lib/auth";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

export async function getMe() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const ws = await ensureWorkspace(session.user.id);
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    workspaceId: ws.workspaceId,
  };
}
```

```ts
// app/api/v1/me/route.ts
import { getMe } from "@/features/auth/api/get-me";

export async function GET() {
  const me = await getMe();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(me);
}
```

```ts
// features/auth/api/workspace-handlers.ts
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { workspaces } from "@/db/schema";
import { ensureWorkspace } from "@/features/auth/use-cases/ensure-workspace";

export async function getWorkspace() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return ws ?? null;
}

export async function updateWorkspaceName(name: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { workspaceId } = await ensureWorkspace(session.user.id);
  const [ws] = await db
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning();
  return ws ?? null;
}
```

```ts
// app/api/v1/workspace/route.ts
import {
  getWorkspace,
  updateWorkspaceName,
} from "@/features/auth/api/workspace-handlers";

export async function GET() {
  const ws = await getWorkspace();
  if (!ws) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ id: ws.id, name: ws.name });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as { name?: string };
  if (!body.name || body.name.trim().length < 1) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  const ws = await updateWorkspaceName(body.name.trim());
  if (!ws) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ id: ws.id, name: ws.name });
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: env + health tests PASS (health needs DB up).

- [ ] **Step 5: Manual smoke**

```bash
curl -s http://localhost:3000/api/v1/health
```

Expected: `{"status":"ok","db":"up"}`

- [ ] **Step 6: Commit**

```bash
git add app/api/v1 features/auth/api tests/health.test.ts
git commit -m "feat: add health, me, and workspace API routes"
```

---

### Task 7: App shell + sign-in + empty dashboard

**Files:**
- Create: `components/layout/app-shell.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/top-bar.tsx`
- Create: `app/(auth)/sign-in/page.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Modify: `app/page.tsx` (redirect)

**Interfaces:**
- Consumes: `auth()`, `signIn`, Button
- Produces: authenticated shell with nav placeholders; empty dashboard CTA

- [ ] **Step 1: Sign-in page (RSC + server action)**

```tsx
// app/(auth)/sign-in/page.tsx
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">MemoryVault AI</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Your vault awaits
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sign in to open your persistent memory workspace.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Shell components**

Sidebar links (disabled or href to future routes): Dashboard (active), Chat, Projects, Tasks, Documents, Settings.

Keep layout minimal, large spacing, no cards-for-decoration. Empty dashboard: one headline + one CTA to sign-in already done; for signed-in: “No memories yet” + text CTA “Start a conversation” linking to `/chat` (page can 404 until M3 — or add stub `app/(app)/chat/page.tsx` saying “Coming soon”).

Add stub pages so nav doesn’t 404:

- `app/(app)/chat/page.tsx`
- `app/(app)/projects/page.tsx`
- `app/(app)/tasks/page.tsx`
- `app/(app)/documents/page.tsx`
- `app/(app)/settings/page.tsx`

Each: simple RSC with title + one sentence “Available in a later milestone.”

- [ ] **Step 3: `(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <AppShell user={session.user}>{children}</AppShell>;
}
```

- [ ] **Step 4: Root redirect**

```tsx
// app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/sign-in");
}
```

- [ ] **Step 5: Manual acceptance**

1. `docker compose up -d` + `npm run dev`
2. Open `/api/v1/health` → ok
3. Open `/` → sign-in
4. Google OAuth (requires real credentials in `.env`)
5. Land on `/dashboard` with sidebar
6. `/api/v1/me` returns user + workspaceId
7. `/api/v1/workspace` returns vault name

- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: add app shell, sign-in, and empty dashboard"
```

---

### Task 8: M0 verification + README update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document runbook in README**

Include: prerequisites, `docker compose up`, copy `.env.example`, Google OAuth setup, `npm run db:push`, `npm run dev`, health check URL, M0 exit criteria.

- [ ] **Step 2: Full verify checklist**

- [ ] `npm test` passes  
- [ ] `npm run build` passes  
- [ ] Health ok with DB  
- [ ] Sign-in → dashboard  
- [ ] Me + workspace APIs work  

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add M0 runbook and verify foundations"
```

---

## M0 exit criteria

- [ ] Sign in with Google  
- [ ] See empty product shell (sidebar + dashboard)  
- [ ] `GET /api/v1/health` → ok  
- [ ] User + workspace 1:1 exist in CockroachDB  
- [ ] Docker Compose runs CockroachDB locally  

---

## Spec coverage (self-review)

| Spec M0 item | Task |
|--------------|------|
| Next.js 15 + TS + Tailwind + shadcn | T1–T2 |
| Docker + env/config | T3 |
| Drizzle + CockroachDB | T3–T4 |
| Auth.js OAuth + users/sessions/workspaces | T4–T5 |
| App shell | T7 |
| health / me / workspace | T6 |

Out of scope (later milestones): memories, Bedrock, chat, vectors, ops metrics panel.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-13-m0-foundations.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?
