# MemoryVault AI — Demo Script

**Duration:** ~5 minutes  
**Live demo:** https://memoryvault-ai-delta.vercel.app  
**Prereqs (local):** Docker + CockroachDB running, `.env` configured, Bedrock access enabled  
**Prereqs (live):** Open the URL above and sign in with Google (add AWS Bedrock keys in Vercel for chat/search)

---

## 1. Sign in (30s)

1. Open https://memoryvault-ai-delta.vercel.app (or http://localhost:3000 locally)
2. Sign in with Google
3. Land on **Dashboard** — empty or seeded memories

> "MemoryVault is memory-first — not another chat scrollback."

---

## 2. Create memories (45s)

1. Click **Add memory**
2. Add a preference: "I prefer concise answers"
3. Add a project fact: "We deploy on Fridays to staging first"
4. Use **search** to find memories semantically (not just keyword match)

---

## 3. Chat with citations (60s)

1. Open **Chat**
2. Ask: "What's my deployment process?"
3. Show streamed response + **Memory context** citations
4. Wait for **Distilled from chat** panel to populate (cold path)

> "Hot path retrieves memories; cold path distills new ones asynchronously."

---

## 4. Projects scope (60s)

1. Open **Projects** → create "Hackathon Demo"
2. Open project detail → scoped memory timeline
3. Click **Project chat** — ask a project-specific question
4. Show tasks/documents previews on project page

---

## 5. Tasks & documents (45s)

1. Open **Tasks** — toggle a task done
2. Open **Documents** — add a text note
3. Return to dashboard — cross-session recall persists

---

## 6. Observability (30s)

```bash
curl http://localhost:3000/api/v1/ops/metrics
```

Show `embed`, `retrieve`, `generate`, and cold `extract` runs.

---

## Key talking points

- **Hybrid memory:** global personal + project-scoped
- **Hot/cold path:** fast chat + async extraction
- **CockroachDB:** relational + vector index
- **Bedrock:** Titan embed + Nova Lite chat
- **Not a chatbot clone:** timeline is the centerpiece
