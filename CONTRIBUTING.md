# Contributing to ChemLang

ChemLang is an open-source project that uses AI agents to translate chemistry into rigorous mathematics and computable code. We're building a shared, formalized mathematical language for chemistry — domain by domain.

Contributions are welcome at every level — from fixing a typo to adding an entirely new chemistry domain.

---

## Ways to contribute

- **Add a new chemistry domain** — photochemistry, nuclear chemistry, polymer chemistry, etc.
- **Improve agent system prompts** — make agents more rigorous, more domain-specific, or better at finding cross-domain connections
- **Improve the UI** — better visualization of the math dictionary, graph views, export formats
- **Add tests** — automate the TTD checklist
- **Fix bugs** — check open issues
- **Improve the debate logic** — more rounds, parallel execution, agent memory across sessions

---

## Local setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### 1. Fork and clone

```bash
git clone https://github.com/ortall0201/chem2math-base44.git
cd chem2math-base44
```

### 2. Frontend

```bash
npm install
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (never commit this file):

```
OPENAI_API_KEY=sk-your-key-here
```

### 4. Run

```bash
# Terminal 1
cd backend && uvicorn main:app --reload

# Terminal 2
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How to add a new agent / domain

### 1. Add the agent config in `backend/agent_configs.py`

```python
AGENT_CONFIGS["photochemistry_researcher"] = {
    "name": "Einstein",
    "domain": "photochemistry",
    "system_prompt": """You are Einstein, a world-class photochemistry researcher...

Your domain: ...

RULES:
- For EVERY concept relevant to the question, call save_math_dictionary_entry.
- ...

Be thorough. A good response saves 3-8 entries."""
}
```

### 2. Add the domain definition in `backend/database.py`

Add an entry to the `DEFAULT_DOMAINS` list in `_seed_domains()`:

```python
{
    "domain_key": "photochemistry",
    "display_name": "Photochemistry",
    "description": "Mathematical treatment of light-matter interactions and photoinduced reactions.",
    "color_accent": "#facc15",
    "core_math_branches": ["Differential equations", "Quantum mechanics", "Statistical mechanics"],
    "key_equations": ["E = hν", "Φ = k_r / (k_r + k_nr)", "A = εlc"],
},
```

### 3. Add the agent to the frontend agent lists

In `src/pages/Agents.jsx`, `src/pages/Mission.jsx`, `src/pages/TeamCommunication.jsx`, and `src/components/dashboard/AgentMonitor.jsx` — add the agent to the `agents` / `AGENTS` array:

```js
{ key: "photochemistry_researcher", name: "Einstein", domain: "Photochemistry", color: "#facc15" },
```

### 4. Add the domain label

In `src/pages/Dictionary.jsx` and `src/components/dictionary/SemanticSearch.jsx`, add to `domainLabels`:

```js
photochemistry: "Photochemistry",
```

### 5. Test it

Run through the relevant sections of `TTD.md` to verify the new agent works end-to-end.

---

## How to improve an agent's system prompt

All system prompts live in `backend/agent_configs.py`. Good prompts:

- Name the specific equations, theorems, and formalisms the agent should know
- Explicitly instruct the agent to call `save_math_dictionary_entry` for every concept
- Give examples of the notation style (ASCII math preferred: `E = E0 - (R*T)/(n*F) * ln(Q)`)
- Specify what a "good response" looks like (e.g. "saves 3-8 entries")

---

## Submitting a pull request

1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run through `TTD.md` to verify nothing is broken
4. Make sure no secrets are staged: `git diff --name-only` should not include `.env` files
5. Commit with a clear message describing what and why
6. Open a PR against `main` with a short description of your change

---

## Code style

- **Frontend**: React functional components, no class components. Keep components focused — if it's getting long, split it.
- **Backend**: Plain functions, no classes. Keep routes thin — logic goes in `database.py` or helper functions.
- **No magic**: If something isn't obvious, add a comment explaining why, not what.

---

## Questions?

Open an issue — happy to discuss new domains, agent architectures, or research directions.
