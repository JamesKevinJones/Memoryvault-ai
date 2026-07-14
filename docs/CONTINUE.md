# Continue here (pause checkpoint)

**Branch:** `m0-foundations` (tracks `origin/m0-foundations`)  
**Repo:** https://github.com/JamesKevinJones/Memoryvault-ai  
**Solo contributor:** Jameskevinjones  

---

## Status: M2 complete — awaiting your review

**Report:** [docs/superpowers/reports/2026-07-14-m2-orchestrator-vectors-complete.md](superpowers/reports/2026-07-14-m2-orchestrator-vectors-complete.md)

Do **not** start M3 until you approve.

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

### M2 env additions

```env
AWS_REGION=us-east-1
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
BEDROCK_EMBED_DIMENSIONS=1024
```

Plus AWS credentials (default SDK chain) with Bedrock Titan Embed access in your region.

---

## When ready for M3

Tell Cursor:

> Start M3 per architecture spec — chat hot path + streaming. Architecture locked. One milestone only; stop for review when done.

---

## Rules still in force

- Architecture doc locked
- One milestone at a time
- Functionality before polish (M6)
- Quality gates before milestone complete
