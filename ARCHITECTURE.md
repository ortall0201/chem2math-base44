# ChemLang — System Architecture

---

## 1. System Topology

```mermaid
graph TB
    subgraph Browser["Browser — localhost:5173"]
        direction TB
        UI["React + Vite + TailwindCSS"]
        Pages["Pages\nDashboard · Domains · Dictionary\nAgents · Team Mission\nTeam Communication · Math Analysis"]
        Clients["API Clients\nlocalAgentsClient.js\nentitiesClient.js"]
        UI --> Pages --> Clients
    end

    subgraph Backend["Backend — 127.0.0.1:8000 (FastAPI)"]
        direction TB
        Routes["Routes\n/conversations\n/team-communication\n/analyze-dictionary\n/entities · /semantic-search"]
        AgentCfg["agent_configs.py\n9 agent system prompts\nSAVE_ENTRY_TOOL definition"]
        DB["database.py\nSQLite CRUD\nconversations · messages · entities"]
        SQLite[("chemlang.db\nSQLite")]
        Routes --> AgentCfg
        Routes --> DB --> SQLite
    end

    subgraph External["External Services"]
        OpenAI["OpenAI API\ngpt-4o — agents\ngpt-4o-mini — chemical extraction\ntext-embedding-3-small — semantic search"]
        PubChem["PubChem REST API\nBoiling point · MW · Formula\nLogP · GHS hazard codes"]
    end

    Clients -->|"HTTP + SSE"| Routes
    Routes -->|"Tool calling + streaming"| OpenAI
    Routes -->|"HTTP GET (synchronous)"| PubChem
```

---

## 2. Agent Conversation Flow (1-on-1 Chat)

```mermaid
sequenceDiagram
    participant U as User (browser)
    participant FE as Frontend
    participant API as FastAPI /conversations/{id}/messages
    participant LLM as GPT-4o
    participant DB as SQLite

    U->>FE: Type message
    FE->>API: POST message (SSE stream)
    API->>DB: add_message(user)
    API->>LLM: chat.completions.create(stream=True)

    loop Streaming loop
        LLM-->>API: chunk (text token)
        API-->>FE: SSE: {type: chunk, content}
        FE-->>U: Render token

        alt Tool call: save_math_dictionary_entry
            LLM-->>API: tool_call (JSON arguments)
            API->>DB: create_entity(MathDictionary)
            API->>LLM: embed entry (background)
            API-->>FE: SSE: {type: tool_call, entry}
            FE-->>U: Show saved entry badge
        end
    end

    API->>DB: add_message(assistant)
    API-->>FE: SSE: {type: done, messages}
```

---

## 3. Team Communication — 4-Round Flow

```mermaid
flowchart TD
    Start([User submits question]) --> R1

    subgraph R1["Round 1 — Domain Experts (6 agents in sequence)"]
        Faraday["Faraday\nElectrochemistry"] & Carnot["Carnot\nThermochemistry"] & Arrhenius["Arrhenius\nKinetics"] & Kekule["Kekulé\nOrganic"] & Bohr["Bohr\nQuantum"] & Lavoisier["Lavoisier\nStoichiometry"]
    end

    R1 -->|"All Round 1 responses bundled"| R2

    subgraph R2["Round 2 — Cross-Domain Debate (each agent reads 5 colleagues)"]
        D1["Faraday reads\nCarnot·Arrhenius·Kekulé·Bohr·Lavoisier"] & D2["Carnot reads\nFaraday·Arrhenius·..."] & D3["..."]
    end

    R2 -->|"Full debate"| R3

    subgraph R3["Round 3 — Maxwell Synthesizes"]
        Maxwell["Maxwell reads all 12 responses\nFinds universal operators\nSaves cross-domain entries"]
    end

    R3 --> PubChem

    subgraph PubChem["PubChem Data Lookup"]
        Extract["GPT-4o-mini\nextracts chemical names"] --> Fetch["HTTP GET to PubChem\nfor each chemical"]
        Fetch --> Props["MW · BP · Formula\nLogP · GHS codes"]
    end

    PubChem -->|"Real chemical data injected"| R4

    subgraph R4["Round 4 — Engineering Decision Model"]
        DM["Decision Model receives:\n• Full 3-round debate\n• Maxwell synthesis\n• Real PubChem data\n\nOutputs 8-section framework:\n1. Required Inputs\n2. Key Variables\n3. Heuristic Screening Rules\n4. Physical Models\n5. Decision Logic (5 risk categories)\n6. JSON Schema\n7. Missing Data\n8. Screening Engine Architecture"]
    end

    R4 --> Done([Stream complete])

    style R1 fill:#0ea5e920,stroke:#0ea5e9
    style R2 fill:#a855f720,stroke:#a855f7
    style R3 fill:#94a3b820,stroke:#94a3b8
    style PubChem fill:#f9731620,stroke:#f97316
    style R4 fill:#22c55e20,stroke:#22c55e
```

---

## 4. Math Analysis Flow (Turing)

```mermaid
flowchart LR
    subgraph Dict["Math Dictionary (SQLite)"]
        E1["Entry: Nernst Equation\ndomain: electrochemistry\nembedding: [0.12, -0.34, ...]"]
        E2["Entry: Gibbs Free Energy\ndomain: thermochemistry\nembedding: [0.11, -0.33, ...]"]
        E3["Entry: Rate Law\ndomain: kinetics\nembedding: [0.05, 0.91, ...]"]
        EN["... N entries total"]
    end

    subgraph Backend["FastAPI /analyze-dictionary"]
        Group["Group entries\nby domain"]
        Cosine["Pairwise cosine similarity\n(cross-domain only)\nthreshold: 0.72"]
        Format["Format structured context:\n• N entries by domain\n• Top 30 cross-domain pairs"]
        Stats["Emit stats event\n→ frontend shows counts"]
    end

    subgraph Turing["Turing (GPT-4o)"]
        T1["1. Corpus Statistics"]
        T2["2. Universal Operators\n(d/dt, ln, e^x, Σ, ∇)"]
        T3["3. Equation Archetypes\n(exponential, eigenvalue,\nconservation, linear)"]
        T4["4. Cross-Domain Clusters\n(semantically equivalent\nequations)"]
        T5["5. Formal Grammar\nProduction Rules"]
        T6["6. NLP Training\nRecommendations"]
    end

    Dict --> Group --> Cosine --> Format --> Stats
    Format -->|"Structured context"| Turing
    Turing -->|"SSE stream"| FE["Frontend\nMathAnalysis.jsx"]

    style Dict fill:#0ea5e910,stroke:#0ea5e9
    style Backend fill:#a855f710,stroke:#a855f7
    style Turing fill:#22c55e10,stroke:#22c55e
```

---

## 5. Data Persistence & Embedding Pipeline

```mermaid
flowchart TD
    AgentSave["Agent calls\nsave_math_dictionary_entry()"] --> CreateEntity["create_entity(MathDictionary, data)\n→ stored as JSON in entities table"]
    CreateEntity --> Background["Background task\n_embed_entry(id)"]
    Background --> EmbedAPI["OpenAI\ntext-embedding-3-small\nInput: concept + formalism + description"]
    EmbedAPI --> StoreVec["update_entity(id, {embedding: [...1536 floats...]})\n→ stored as JSON array in SQLite"]

    StoreVec --> SemanticSearch["POST /semantic-search\nQuery → embed → cosine similarity\nagainst all stored vectors"]
    StoreVec --> TuringAnalysis["POST /analyze-dictionary\nCross-domain pairwise cosine\n→ Turing grammar extraction"]

    subgraph SQLite["chemlang.db"]
        T1[("conversations\nid · agent_name · metadata · created_at")]
        T2[("messages\nid · conv_id · role · content · created_at")]
        T3[("entities\nid · type · data (JSON) · created_at · updated_at\n\ndata contains: concept_name, domain,\nmath_formalism, code_representation,\nnatural_language, embedding [1536 floats], ...")]
    end

    StoreVec --> SQLite
```

---

## 6. NLP Roadmap

```mermaid
flowchart LR
    A["Agent Sessions\n(1-on-1 + Team Mission\n+ Team Communication)"]
    -->|"save_math_dictionary_entry"| B

    B["Math Dictionary\n(growing corpus of labeled\nchemistry → math pairs)"]
    -->|"POST /analyze-dictionary"| C

    C["Turing Analysis\nProduction rules:\nchem sentence → math structure"]
    -->|"Export grammar"| D

    D["Training Dataset\n(sentence, equation) pairs\nwith domain labels"]
    -->|"Fine-tune"| E

    E["Seq2Seq NLP Model\nor LLM fine-tune\n(chemistry text → LaTeX / Python)"]
    -->|"Deploy"| F

    F["NLP Endpoint\nInput: plain English chemistry\nOutput: math formalism + Python code"]

    style A fill:#0ea5e915
    style B fill:#f9731615
    style C fill:#22c55e15
    style D fill:#a855f715
    style E fill:#ec489915
    style F fill:#eab30815
```
