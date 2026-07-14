# Continue here (pause checkpoint)

**Branch:** `m0-foundations` (tracks `origin/m0-foundations`)  
**Repo:** https://github.com/JamesKevinJones/Memoryvault-ai  
**Solo contributor:** Jameskevinjones  

---

## Status: M4 complete — awaiting your review

**Report:** [docs/superpowers/reports/2026-07-14-m4-cold-path-complete.md](superpowers/reports/2026-07-14-m4-cold-path-complete.md)

Do **not** start M5 until you approve.

---

## Resume dev environment

```powershell
cd c:\Kevincodes\memoryvault-ai
git checkout m0-foundations
git pull
npm install
docker compose up -d
npm run db:push
npm run dev
```

Open http://localhost:3000 → sign in → **Chat** (`/chat`).

---

## When ready for M5

Tell Cursor:

> Start M5 per architecture spec — projects/tasks/docs scoped memory. Architecture locked. One milestone only; stop for review when done.

---

## Rules still in force

- Architecture doc locked
- One milestone at a time
- Functionality before polish (M6)
- Quality gates before milestone complete
