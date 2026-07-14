# Continue here (pause checkpoint)

**Branch:** `m0-foundations` (tracks `origin/m0-foundations`)  
**Repo:** https://github.com/JamesKevinJones/Memoryvault-ai  
**Solo contributor:** Jameskevinjones  

---

## Status: M3 complete — awaiting your review

**Report:** [docs/superpowers/reports/2026-07-14-m3-chat-hot-path-complete.md](superpowers/reports/2026-07-14-m3-chat-hot-path-complete.md)

Do **not** start M4 until you approve.

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

### Required env

```env
AWS_REGION=us-east-1
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
BEDROCK_EMBED_DIMENSIONS=1024
BEDROCK_CHAT_MODEL_ID=amazon.nova-lite-v1:0
```

Plus AWS credentials with Bedrock Titan Embed + Nova Lite access.

---

## When ready for M4

Tell Cursor:

> Start M4 per architecture spec — cold path extraction. Architecture locked. One milestone only; stop for review when done.

---

## Rules still in force

- Architecture doc locked
- One milestone at a time
- Functionality before polish (M6)
- Quality gates before milestone complete
