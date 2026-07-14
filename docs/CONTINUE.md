# Continue here (pause checkpoint)

**Branch:** `m0-foundations` (tracks `origin/m0-foundations`)  
**Repo:** https://github.com/JamesKevinJones/Memoryvault-ai  
**Solo contributor:** Jameskevinjones  

---

## Status: M1 complete — awaiting your review

**Report:** [docs/superpowers/reports/2026-07-14-m1-memory-crud-complete.md](superpowers/reports/2026-07-14-m1-memory-crud-complete.md)

Do **not** start M2 until you approve.

---

## Resume dev environment

```powershell
cd c:\Kevincodes\memoryvault-ai
git checkout m0-foundations
git pull
npm install
docker compose up -d
docker compose exec cockroach ./cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS memoryvault;"
npm run db:push
npm run dev
```

Open http://localhost:3000 → Google sign-in → **Memory timeline** dashboard.

`.env` is local only (never commit). `.env.example` stays placeholder-only.

---

## When ready for M2

Tell Cursor:

> Start M2 per architecture spec — Orchestrator + Bedrock + vector search. Architecture locked. One milestone only; stop for review when done.

Plan will be written for M2 before implementation (same process as M1).

---

## Rules still in force

- Architecture doc locked
- One milestone at a time
- Functionality before polish (M6)
- Quality gates before milestone complete
