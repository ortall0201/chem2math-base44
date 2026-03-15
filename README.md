# ChemLang — Chemistry → Math → Code

A multilingual dictionary that translates chemistry concepts into rigorous mathematical formalisms, runnable Python 3 code, and natural language — domain by domain, powered by AI agents.

---

## What it does

ChemLang uses specialized AI agents to formalize chemistry into three representations:

- **Math formalism** — rigorous ASCII notation (e.g. `E = E0 - (R*T)/(n*F) * ln(Q)`)
- **Code** — runnable Python 3 implementation of the formula (numpy / scipy / sympy)
- **Natural language** — plain English explanation of what it means and when to use it

Every entry is saved to a shared **Math Dictionary** that grows over time and is automatically embedded for semantic search. The long-term goal is to build a formal mathematical grammar for chemistry that can train an NLP layer — so that a process engineer can type a question in plain English and get back the correct mathematical model.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full system diagrams.

---

## Architecture

```
frontend/          React + Vite + TailwindCSS + shadcn/ui
backend/           FastAPI (Python) + SQLite + OpenAI API
external/          PubChem REST API (live chemical property data)
```

The frontend talks directly to a local FastAPI backend at `http://127.0.0.1:8000`. No external BaaS — everything runs on your machine. The only external calls are to the OpenAI API and PubChem.

---

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview of all domains, entry counts, graph view |
| **Domains** | Browse each chemistry domain and its dictionary entries |
| **Dictionary** | Full dictionary with keyword search and semantic (embedding-based) search |
| **Agents** | Chat 1-on-1 with any domain agent in a persistent research session |
| **Team Mission** | Broadcast one question to all 6 agents simultaneously — each saves entries independently |
| **Team Communication** | 4-round structured debate: agents formalize → debate cross-domain → Maxwell synthesizes → PubChem data lookup → Decision Model produces engineering framework |
| **Math Analysis** | Turing reads the full dictionary, computes cross-domain semantic clusters from embeddings, and extracts the formal mathematical grammar of chemistry — the foundation for NLP training |

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
| Decision Model | Engineering | 5-risk-category industrial safety framework (reactive / condensation / corrosion / deposit / unknown) |
| **Turing** | **Math Linguistics** | **Reads full dictionary, clusters by embedding similarity, extracts formal grammar production rules for NLP training** |

Each domain agent (Faraday–Maxwell) calls `save_math_dictionary_entry` for every concept it identifies — so the dictionary grows automatically. All code representations are **Python 3** (numpy / scipy / sympy / networkx depending on domain).

---

## Team Communication — how it works

Unlike Team Mission (parallel independent agents), Team Communication runs a structured 4-round debate that ends with an engineering decision framework grounded in real chemical data.

### The four rounds

1. **Round 1 — Domain Experts**
   Each of the 6 agents independently formalizes the concept in their domain, calling `save_math_dictionary_entry` for every equation, formalism, or concept they identify. Entries are saved to the dictionary in real time.

2. **Round 2 — Cross-Domain Debate**
   Each agent reads all 5 colleagues' Round 1 responses and argues about mathematical connections — where are the equations secretly the same thing? This is where Faraday notices his Nernst equation and Carnot's ΔG are the same thermodynamic statement, and Arrhenius sees his K_eq is the Q they're both using.

3. **Round 3 — Maxwell Synthesizes**
   Maxwell reads the full Round 2 debate and produces a unified mathematical framework. It looks for equations that appear identically or analogously across multiple domains — universal conservation laws, shared differential equation forms, and how energy appears and transforms across all six domains.

4. **PubChem Live Data Lookup** _(between rounds 3 and 4)_
   GPT-4o-mini extracts every chemical species named in the debate. For each chemical, a live query is sent to the [PubChem REST API](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) to retrieve:
   - Molecular weight, boiling point, molecular formula
   - LogP (lipophilicity proxy)
   - GHS hazard classification codes
   This real data is injected into the Decision Model's prompt so its risk assessment is grounded in actual physical properties, not estimates.

5. **Round 4 — Engineering Decision Model**
   A specialized agent converts the debate + real PubChem data into a machine-operable engineering decision framework. The output is structured into exactly 8 sections:

   | Section | Content |
   |---------|---------|
   | 1. Required Inputs | Every input parameter: name, type, unit, and data source |
   | 2. Key Variables | Symbol table with physical meaning, unit, and industrial range |
   | 3. Heuristic Screening Rules | Fast `IF [condition] THEN flag` pre-screening rules (labeled HEURISTIC) |
   | 4. Physical Models | First-principles equations for condensation, reaction thermodynamics, corrosion, and film/deposit formation |
   | 5. Decision Logic — 5 Risk Categories | Explicit if/then/else for: reactive risk, condensation risk, corrosive condensate risk, deposit/film risk, and unknown/missing data |
   | 6. JSON Schema | Machine-readable industrial stream representation with GHS codes, vapor pressures, and confidence score |
   | 7. Missing Data in Real Factories | What is almost never instrumented and how to estimate it |
   | 8. Chem2Math Screening Engine | Concrete algorithmic pipeline: input layer → data enrichment → heuristic screening → physics layer → risk aggregation → output |

### Why this matters

The Decision Model deliberately separates **heuristic screening** (fast, conservative, minimal data) from **physical models** (first-principles equations with explicit validity ranges). This matches how real process engineers think: check the fast rules first, then run the physics if needed. The JSON schema in Section 6 is designed to be directly importable into a process safety system.

---

## Math Analysis Engine — how it works

The **Math Analysis** page runs Turing, a data science agent whose only input is the accumulated Math Dictionary.

```
All dictionary entries
        ↓
Group by domain
        ↓
Compute pairwise cosine similarity (from stored embeddings)
        ↓
Flag cross-domain pairs with similarity > 0.72
        ↓
Feed structured context to Turing (GPT-4o)
        ↓
6-section analysis: operators · archetypes · clusters · grammar · NLP roadmap
```

Turing's output includes **production rules** — formal mappings from chemistry language patterns to mathematical structures. For example:

```
"rate of change of [X]"         => d[X]/dt          [kinetics]
"equilibrium between A and B"   => K = exp(-ΔG/RT)  [thermochemistry / electrochemistry]
"transition probability"        => |<ψ_f|H'|ψ_i>|²  [quantum chemistry]
```

These production rules are the training data layer for the future NLP model. The more entries in the dictionary, the richer and more precise the grammar becomes. Running Turing after every major session turns every agent conversation into a step toward a chemistry natural language processor.

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

| Model | Per chat message | Per Team Mission | Per Team Communication (4 rounds) | Per Math Analysis |
|-------|-----------------|-----------------|----------------------------------|-------------------|
| gpt-4o | ~$0.01–0.03 | ~$0.30–0.90 | ~$0.80–2.00 | ~$0.05–0.20 |
| gpt-4o-mini | ~$0.001 | ~$0.03–0.09 | ~$0.08–0.20 | ~$0.005–0.02 |

> **Team Communication** costs more than Team Mission because it runs 4 rounds, each agent in Round 2 receives all Round 1 responses as context, and Round 4's Decision Model receives the full debate plus real PubChem data.
> **Math Analysis** cost scales with dictionary size — more entries means a larger context window for Turing.

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
| POST | `/team-communication` | Launch 4-round agent debate with PubChem data lookup, stream SSE |
| GET | `/entities/{name}` | List entities (MathDictionary, DomainDefinition, Mission) |
| POST | `/entities/{name}` | Create entity |
| PUT | `/entities/{name}/{id}` | Update entity |
| DELETE | `/entities/{name}/{id}` | Delete entity |
| POST | `/entities/{name}/filter` | Filter entities by field |
| POST | `/semantic-search` | Semantic search over embedded dictionary entries |
| POST | `/analyze-dictionary` | Turing reads full dictionary, computes embedding clusters, streams grammar analysis |

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
    MathAnalysis.jsx
  components/
    dashboard/      — StatsRow, DomainCard, GraphView, AgentMonitor
    dictionary/     — CodePlayground, SemanticSearch
    mission/        — MissionReportButton (export to PDF/Markdown)
    agents/         — MessageBubble
    layout/         — AppLayout (sidebar nav)
  api/
    localAgentsClient.js  — Fetch wrapper for agent conversations, team communication, and math analysis SSE
    entitiesClient.js     — Fetch wrapper for entity CRUD + semantic search

ARCHITECTURE.md   — Full system diagrams (Mermaid)
```
