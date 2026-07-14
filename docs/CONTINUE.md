# Continue here (pause checkpoint)

**Branch:** `main` (deploy branch) / `m0-foundations` (dev history)
**Repo:** https://github.com/JamesKevinJones/Memoryvault-ai
**Live demo:** https://memoryvault-ai-delta.vercel.app

---

## Status: ALL MILESTONES COMPLETE (M0–M7)

**Reports:** see `superpowers/reports/` — latest: [M7 deploy](superpowers/reports/2026-07-14-m7-deploy-complete.md)

**Demo script:** [docs/DEMO.md](../DEMO.md)

---

## Outstanding (owner actions)

1. Add Google OAuth redirect URI in Google Cloud Console:
   `https://memoryvault-ai-delta.vercel.app/api/auth/callback/google`
2. (Optional) Add `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` to Vercel env to enable Bedrock chat + semantic search in prod.
3. (Optional) Connect the GitHub repo in the Vercel dashboard for auto-deploys from `main`.
