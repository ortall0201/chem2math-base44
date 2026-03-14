# Test-To-Deploy Checklist

Run through this checklist before each release to verify the app is working end-to-end.

---

## 0. Environment

- [ ] `backend/.env` exists and contains a valid `OPENAI_API_KEY`
- [ ] `npm install` completed without errors
- [ ] `pip install -r backend/requirements.txt` completed without errors
- [ ] No `.env` files appear in `git status` (they must all be gitignored)
- [ ] `backend/chemlang.db` is NOT tracked by git

---

## 1. Backend Startup

```bash
cd backend && uvicorn main:app --reload
```

- [ ] Server starts on `http://127.0.0.1:8000` with no errors
- [ ] `GET http://127.0.0.1:8000/health` returns `{"status": "ok"}`
- [ ] On first run: `chemlang.db` is created automatically
- [ ] Domain seeding: `GET http://127.0.0.1:8000/entities/DomainDefinition` returns 6 domains

---

## 2. Database Persistence

- [ ] Create a MathDictionary entry via the Agents page or API
- [ ] Stop the backend (`Ctrl+C`)
- [ ] Restart the backend
- [ ] Verify the entry still exists in `GET http://127.0.0.1:8000/entities/MathDictionary`
- [ ] Verify the 6 domain definitions are still present (seeding should NOT duplicate on restart)

---

## 3. Frontend Startup

```bash
npm run dev
```

- [ ] Vite starts on `http://localhost:5173` with no errors
- [ ] Dashboard loads and shows domain cards
- [ ] Dictionary page loads (may show empty if no entries yet)
- [ ] No console errors related to CORS or failed fetches on page load

---

## 4. Agent Conversations

- [ ] Navigate to **Agents** page
- [ ] Select an agent (e.g. Faraday)
- [ ] Click **New Session** — chat panel opens with no error
- [ ] Type a message and press Enter/Send
- [ ] Response streams in token by token
- [ ] Backend terminal shows `POST /conversations` and `POST /conversations/{id}/messages`
- [ ] After the response, a new entry appears in the **Dictionary** page

---

## 5. Semantic Search

- [ ] Ensure at least a few dictionary entries exist
- [ ] Navigate to **Dictionary** → switch to **Semantic** mode
- [ ] Type a concept (e.g. "energy conservation") and click Search
- [ ] Results appear with a `% match` score
- [ ] If no results: entries may not have been embedded yet — wait a few seconds and retry

---

## 6. Team Mission

- [ ] Navigate to **Team Mission**
- [ ] Enter a prompt and click **Launch Mission**
- [ ] All 6 agent panels appear and start showing activity
- [ ] Entries are being saved (Agent Monitor shows `+N entries saved`)
- [ ] After all 6 finish, Dictionary shows new entries
- [ ] Mission record appears in Mission History with status `completed`

---

## 7. Team Communication (3-round debate)

- [ ] Navigate to **Team Communication**
- [ ] Enter a prompt and click **Launch Debate**
- [ ] **Round 1** appears — 6 agent cards stream their responses sequentially
- [ ] **Round 2** appears after Round 1 finishes — agents reference each other's work
- [ ] **Round 3** appears — Maxwell's card is full-width and synthesizes everything
- [ ] Green "Debate complete" banner shows at the bottom with entry count
- [ ] Dictionary has new cross-domain entries
- [ ] Backend shows 13 LLM calls in terminal (6 + 6 + 1)

---

## 8. Export (Mission Report)

- [ ] Complete a Team Mission
- [ ] Click **Export** on a completed mission
- [ ] **Download Markdown** — file downloads and contains agent responses + dictionary entries
- [ ] **Download PDF** — file downloads with dark theme layout

---

## 9. Domains Page

- [ ] Navigate to **Domains** — 6 domain cards appear
- [ ] Click a domain — detail page shows with key equations and core math branches
- [ ] Dictionary entries for that domain are listed

---

## 10. Security Pre-flight

- [ ] `git status` shows no `.env` files staged
- [ ] `git diff --name-only` contains no files with secrets
- [ ] `backend/.env.example` contains only the placeholder `sk-your-key-here`
- [ ] Run: `grep -r "sk-proj\|sk-[a-zA-Z0-9]" . --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts"` — must return no matches

---

## 11. Version Tag

Before merging/deploying:

```bash
# Confirm version in package.json matches the tag
cat package.json | grep version

# Tag the release
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | 2026-03-14 | Initial release — full Base44 removal, self-hosted FastAPI backend, all 7 agents, Team Communication |
