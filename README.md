# ChemLang — Chemistry → Math → Code

A multilingual dictionary that translates chemistry concepts into mathematical formalisms, computable JavaScript code, and natural language — domain by domain, powered by AI agents.

---

## What it does

ChemLang uses specialized AI agents to formalize chemistry into three representations:

- **Math formalism** — rigorous ASCII notation (e.g. `E = E0 - (R*T)/(n*F) * ln(Q)`)
- **Code** — runnable JavaScript implementation of the formula
- **Natural language** — plain English explanation of what it means and when to use it

Every entry is saved to a shared **Math Dictionary** that grows over time. The goal is to build a complete, computable mathematical language for chemistry — domain by domain.

---

## Architecture

```
frontend/          React + Vite + TailwindCSS + shadcn/ui
backend/           FastAPI (Python) + SQLite + OpenAI API
```

The frontend talks directly to a local FastAPI backend at `http://127.0.0.1:8000`. No external BaaS — everything runs on your machine. The only external call is to the OpenAI API.

---

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview of all domains, entry counts, graph view |
| **Domains** | Browse each chemistry domain and its dictionary entries |
| **Dictionary** | Full dictionary with keyword search and semantic (embedding-based) search |
| **Agents** | Chat 1-on-1 with any domain agent in a persistent research session |
| **Team Mission** | Broadcast one question to all 6 agents simultaneously — each saves entries independently |
| **Team Communication** | 3-round structured debate: agents formalize → debate cross-domain connections → Maxwell synthesizes a unified framework |

---

## AI Agents

| Codename | Domain | Specialty |
|----------|--------|-----------|
| Faraday | Electrochemistry | Nernst equation, Butler-Volmer, impedance, charge transfer |
| Carnot | Thermochemistry | Gibbs free energy, entropy, thermodynamic cycles |
| Arrhenius | Kinetics | Rate laws, Arrhenius equation, transition state theory |
| Kekulé | Organic Chemistry | Molecular graph theory, reaction mechanisms, SMILES |
| Bohr | Quantum Chemistry | Schrödinger equation, MO theory, DFT, Hartree-Fock |
| Lavoisier | Stoichiometry | Mass balance, stoichiometric matrices, null space |
| Maxwell | Synthesis | Cross-domain connections, universal operators, unified formalisms |

Each agent has a system prompt that instructs it to call `save_math_dictionary_entry` for every concept it identifies — so the dictionary grows automatically as you chat.

---

## Team Communication — how it works

Unlike Team Mission (parallel independent agents), Team Communication runs a structured 3-round debate:

1. **Round 1 — Domain Experts**: Each of the 6 agents independently formalizes the concept in their domain
2. **Round 2 — Cross-Domain Debate**: Each agent reads all 5 colleagues' Round 1 responses and argues about mathematical connections — where are the equations secretly the same thing?
3. **Round 3 — Maxwell Synthesizes**: Maxwell reads the full debate and produces a unified mathematical framework, saving cross-domain unifications to the dictionary

This is where the interesting science happens — Faraday notices his Nernst equation and Carnot's ΔG are the same statement, Arrhenius sees his K_eq is the Q they're both using, and so on.

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- An OpenAI API key

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` with your OpenAI key:

```
OPENAI_API_KEY=sk-your-key-here
```

> `backend/.env` is gitignored. Never commit your real key.

### 3. Run both servers

**Terminal 1 — backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 — frontend:**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Cost

All AI calls go through your OpenAI account.

| Model | Per chat message | Per Team Mission | Per Team Communication |
|-------|-----------------|-----------------|----------------------|
| gpt-4o | ~$0.01–0.03 | ~$0.30–0.90 | ~$0.50–1.50 |
| gpt-4o-mini | ~$0.001 | ~$0.03–0.09 | ~$0.05–0.15 |

To switch models, change one line in `backend/main.py`:

```python
model="gpt-4o-mini",  # cheaper, still very capable
```

---

## Data persistence

All data is stored locally in `backend/chemlang.db` (SQLite). This file survives server restarts.

Tables:
- `conversations` — agent chat sessions
- `messages` — individual messages per conversation
- `entities` — all app data (MathDictionary, DomainDefinition, Mission) stored as JSON with a type discriminator

Dictionary entries are automatically embedded with `text-embedding-3-small` for semantic search.

The 6 chemistry domains are seeded automatically on first startup.

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/conversations` | Create agent conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{id}` | Get conversation with messages |
| POST | `/conversations/{id}/messages` | Send message, stream SSE response |
| POST | `/team-communication` | Launch 3-round agent debate, stream SSE |
| GET | `/entities/{name}` | List entities (MathDictionary, DomainDefinition, Mission) |
| POST | `/entities/{name}` | Create entity |
| PUT | `/entities/{name}/{id}` | Update entity |
| DELETE | `/entities/{name}/{id}` | Delete entity |
| POST | `/entities/{name}/filter` | Filter entities by field |
| POST | `/semantic-search` | Semantic search over embedded dictionary entries |

---

## Project structure

```
backend/
  main.py           — FastAPI app, all routes, agent streaming, team communication
  agent_configs.py  — System prompts for all 7 agents + save_math_dictionary_entry tool definition
  database.py       — SQLite CRUD for conversations, messages, and entities
  requirements.txt  — Python dependencies
  .env              — Your OpenAI key (gitignored)
  chemlang.db       — SQLite database (gitignored, auto-created)

src/
  pages/
    Dashboard.jsx
    Domains.jsx
    Dictionary.jsx
    Agents.jsx
    Mission.jsx
    TeamCommunication.jsx
  components/
    dashboard/      — StatsRow, DomainCard, GraphView, AgentMonitor
    dictionary/     — CodePlayground, SemanticSearch
    mission/        — MissionReportButton (export to PDF/Markdown)
    agents/         — MessageBubble
    layout/         — AppLayout (sidebar nav)
  api/
    localAgentsClient.js  — Fetch wrapper for agent conversations + team communication SSE
    entitiesClient.js     — Fetch wrapper for entity CRUD + semantic search
```
