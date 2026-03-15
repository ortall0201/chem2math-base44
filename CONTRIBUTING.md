# Contributing to ChemLang

ChemLang is an open-source project that uses AI agents to translate chemistry into rigorous mathematics and computable code. We're building a shared, formalized mathematical language for chemistry — domain by domain.

Contributions are welcome at every level — from fixing a typo to adding an entirely new chemistry domain.

---

## Ways to contribute

- **Add a new chemistry domain** — photochemistry, nuclear chemistry, polymer chemistry, etc.
- **Improve agent system prompts** — make agents more rigorous, more domain-specific, or better at finding cross-domain connections
- **Improve Turing's grammar extraction** — sharpen the production rules, add more grammar patterns, improve the NLP training recommendations
- **Improve the Decision Model** — extend the 5-risk-category framework, add new physical models, or improve the JSON schema
- **Add new external data sources** — NIST WebBook, ChemSpider, CAS registry, or DECHEMA corrosion data
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
- All `code_representation` instructions must specify **Python 3**. Use the appropriate library hint for the domain: `numpy`/`scipy` for calculus-heavy agents, `numpy.linalg` for Lavoisier, `networkx` for Kekulé, `sympy` for Bohr

---

## How to improve Turing (Math Analysis Engine)

Turing's system prompt is `AGENT_CONFIGS["data_science_agent"]` in `backend/agent_configs.py`.

### What Turing does

Turing receives:
1. All dictionary entries grouped by domain (concept name + math formalism)
2. Pre-computed cross-domain similarity pairs (cosine similarity > 0.72 from stored embeddings)

And produces 6 sections:
1. Corpus statistics
2. Universal mathematical operators (which appear across all 6 domains)
3. Recurring equation archetypes (exponential decay, Boltzmann weighting, eigenvalue equations, etc.)
4. Cross-domain semantic clusters (entries that are mathematically equivalent across domains)
5. **Formal mathematical grammar** — production rules mapping chemistry language → math structure
6. NLP training recommendations

### The grammar production rules (Section 5)

This is the most important output. Production rules look like:

```
"rate of change of [X]"       => d[X]/dt          [kinetics]
"equilibrium between A and B" => K = exp(-ΔG/RT)  [thermochemistry]
"transition probability"      => |<ψ_f|H'|ψ_i>|²  [quantum chemistry]
```

To improve the grammar:
- Add more entries to the dictionary (more sessions = more training data for Turing)
- Update Turing's prompt to ask for more rules (increase from 15–25 to 30–50)
- Add a `save_grammar_rule` tool that saves individual rules to the database so they persist across sessions

### Improving the similarity threshold

The backend caps cross-domain pairs at cosine similarity > 0.72. Lower this to 0.65 to find weaker analogies, or raise to 0.80 for strict equivalences only. Change the constant in `_run_dictionary_analysis()` in `backend/main.py`.

### The NLP roadmap

The intended pipeline is:

```
Math Dictionary entries (accumulated)
         ↓
Turing grammar extraction
         ↓
Production rules as training data
         ↓
Fine-tune a sequence-to-sequence model on (chemistry sentence → math formalism) pairs
         ↓
Deploy as NLP endpoint: chemistry language in, LaTeX / Python code out
```

The dictionary is the training corpus. Every agent session adds labeled examples. Turing's production rules are the grammar labels. This is why building the dictionary is the most important thing you can do right now — it is the dataset.

---

## How to improve the Decision Model

The Decision Model prompt lives in `AGENT_CONFIGS["decision_model"]` in `backend/agent_configs.py`. It instructs the agent to output exactly 8 sections covering required inputs, key variables, heuristic rules, physical models, 5-risk-category decision logic, a JSON schema, missing-data guidance, and a pipeline architecture.

### The 5 risk categories

The Decision Model scores five independent risk dimensions:

| Category | What it assesses |
|----------|-----------------|
| **Reactive Risk** | Can mixed components react chemically at stream conditions? |
| **Condensation Risk** | Will any component condense at the surface temperature? |
| **Corrosive Condensate Risk** | If condensation occurs, is the liquid corrosive to the pipe material? |
| **Deposit / Film Risk** | Can solid deposits, polymers, or fouling films form? |
| **UNKNOWN** | Which risks cannot be assessed due to missing inputs, and what measurement would resolve them? |

Each category outputs `HIGH | MEDIUM | LOW | UNKNOWN`.

### Key design rules for the Decision Model prompt

- **Separate heuristics from physics.** Section 3 is fast `IF/THEN` rules that need minimal data (conservative, labeled `HEURISTIC`). Section 4 is first-principles equations with explicit validity ranges. Never mix them.
- **Physically grounded variables only.** No abstract "indices" or "scores" — every variable must map to a real measurable quantity with units.
- **Real data injection.** The Decision Model receives the output of the PubChem lookup (boiling points, GHS codes, molecular weights) injected into its prompt. The prompt should use these explicitly — reference `boiling_point_C` and `ghs_hazard_codes` from the data block.
- **Section 6 JSON schema.** The schema includes `cas_number`, `pubchem_cid`, `ghs_hazard_codes`, and `vapor_pressure_kPa_at_stream_T` per component — these must stay in sync with the PubChem fetch in `_fetch_pubchem()` in `backend/main.py`.

### Adding a new risk category

1. Add the category to Section 5 of the Decision Model system prompt in `agent_configs.py`
2. Add the corresponding field to the JSON schema in Section 6 (e.g. `"explosion_risk": "HIGH | MEDIUM | LOW | UNKNOWN"`)
3. Update the `DecisionModelCard` component in `src/pages/TeamCommunication.jsx` to color-code the new category heading
4. Update the JSON schema in `src/pages/TeamCommunication.jsx` if it renders the schema inline

---

## How to add a new external data source

The PubChem lookup runs in `_fetch_pubchem(name)` in `backend/main.py`. The full data-fetch flow is in `_team_communication_stream()` — it calls `_extract_chemicals()` (GPT-4o-mini) then loops over chemicals to call `_fetch_pubchem()`.

### Adding NIST WebBook data

NIST WebBook has an API for thermodynamic data (Antoine coefficients, heat of vaporization, heat capacity). Example endpoint:

```
https://webbook.nist.gov/cgi/cbook.cgi?Name={chemical}&Units=SI&cTG=on&json
```

To add it:

1. Write a `_fetch_nist(name)` function in `backend/main.py` that calls the NIST endpoint using `http_requests.get()`
2. Call it from `_team_communication_stream()` after `_fetch_pubchem()`, in the same data-fetch loop
3. Emit the result as a `data_fetch_result` SSE event with a `source: "NIST"` field
4. Handle the new event in `DataFetchPanel` in `src/pages/TeamCommunication.jsx`
5. Inject the NIST data into the Decision Model prompt alongside the PubChem block

### Adding a new data source — general checklist

- Use `requests` (synchronous) inside `_team_communication_stream()`, which is a synchronous generator — do **not** use `httpx` async here
- Always emit `data_fetch_start` before the request and `data_fetch_result` after, so the UI shows live progress
- Handle HTTP errors gracefully — a missing chemical should emit `{ "found": false }`, not crash the stream
- Document the new endpoint in this file and in `README.md`

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
