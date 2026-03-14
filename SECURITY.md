# Security Policy

## Secrets & Credentials

### What must NEVER be committed

| File | Contains | Status |
|------|----------|--------|
| `backend/.env` | `OPENAI_API_KEY` | Gitignored ✓ |
| `.env.local` | Base44 app credentials (legacy, unused) | Gitignored ✓ |
| `backend/chemlang.db` | All app data (conversations, entries) | Gitignored ✓ |
| `backend/__pycache__/` | Python bytecode | Gitignored ✓ |

### What IS safe to commit

| File | Contains |
|------|----------|
| `backend/.env.example` | Placeholder only: `OPENAI_API_KEY=sk-your-key-here` |
| `backend/requirements.txt` | Python dependencies, no secrets |
| `backend/agent_configs.py` | System prompts, no secrets |
| `src/api/localAgentsClient.js` | Hardcoded `http://127.0.0.1:8000` — local only, fine |

---

## Setup for a new developer

1. Clone the repo
2. Create `backend/.env` — **never `.env.example`**:
   ```
   OPENAI_API_KEY=sk-your-real-key-here
   ```
3. Do not paste your key anywhere else — not in code, not in chat, not in issues

---

## What runs where

- **All AI calls** go to OpenAI's API from the backend process — the API key never touches the frontend
- **All data** is stored locally in `backend/chemlang.db` — nothing is sent to any third party except OpenAI
- **No authentication** — this app is designed for local use only. Do not expose port 8000 to the internet without adding auth

---

## If a key was accidentally committed

1. Revoke the key immediately at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Remove it from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```
3. Generate a new key and place it only in `backend/.env`

---

## Production considerations

This app is currently designed for **local development use only**. Before exposing to the internet:

- [ ] Add authentication (the app has no login — anyone who can reach port 5173/8000 can use it)
- [ ] Move `BACKEND_URL` in `localAgentsClient.js` and `entitiesClient.js` to an environment variable
- [ ] Add rate limiting to the FastAPI backend (especially `/team-communication` — it makes 13 LLM calls)
- [ ] Serve the frontend as a static build (`npm run build`) behind a web server, not `vite dev`
- [ ] Use HTTPS
- [ ] Set `allow_origins` in CORS to your specific domain instead of `"*"`
