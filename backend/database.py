import json
import uuid
from datetime import datetime, timezone

import sqlite3

DB_PATH = "chemlang.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                agent_name TEXT NOT NULL,
                metadata TEXT DEFAULT '{}',
                created_date TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_date TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS entities (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                data TEXT NOT NULL,
                created_date TEXT NOT NULL,
                updated_date TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)")
        conn.commit()
    _seed_domains()


# ── Conversations ──────────────────────────────────────────────────────────────

def create_conversation(agent_name: str, metadata: dict) -> dict:
    conv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO conversations VALUES (?, ?, ?, ?)",
            (conv_id, agent_name, json.dumps(metadata), now)
        )
        conn.commit()
    return {"id": conv_id, "agent_name": agent_name, "metadata": metadata, "created_date": now, "messages": []}


def get_conversation(conv_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,)).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "agent_name": row["agent_name"],
            "metadata": json.loads(row["metadata"]),
            "created_date": row["created_date"],
            "messages": get_messages(conv_id)
        }


def list_conversations(agent_name: str = None) -> list:
    with get_conn() as conn:
        if agent_name:
            rows = conn.execute(
                "SELECT * FROM conversations WHERE agent_name = ? ORDER BY created_date DESC",
                (agent_name,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM conversations ORDER BY created_date DESC").fetchall()
        return [
            {"id": r["id"], "agent_name": r["agent_name"], "metadata": json.loads(r["metadata"]), "created_date": r["created_date"]}
            for r in rows
        ]


def get_messages(conv_id: str) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_date ASC",
            (conv_id,)
        ).fetchall()
        return [{"id": r["id"], "role": r["role"], "content": r["content"], "created_date": r["created_date"]} for r in rows]


def add_message(conv_id: str, role: str, content: str) -> dict:
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
            (msg_id, conv_id, role, content, now)
        )
        conn.commit()
    return {"id": msg_id, "conversation_id": conv_id, "role": role, "content": content, "created_date": now}


# ── Generic Entities ───────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc).isoformat()


def list_entities(entity_type: str, sort: str = None, limit: int = None) -> list:
    with get_conn() as conn:
        if sort:
            col = sort.lstrip("-")
            direction = "DESC" if sort.startswith("-") else "ASC"
            # created_date / updated_date are top-level columns; everything else is in JSON
            if col in ("created_date", "updated_date"):
                order = f"{col} {direction}"
            else:
                order = f"json_extract(data, '$.{col}') {direction}"
        else:
            order = "created_date DESC"

        q = f"SELECT data FROM entities WHERE type = ? ORDER BY {order}"
        params = [entity_type]
        if limit:
            q += " LIMIT ?"
            params.append(limit)
        rows = conn.execute(q, params).fetchall()
        return [json.loads(r["data"]) for r in rows]


def get_entity(entity_type: str, entity_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT data FROM entities WHERE type = ? AND id = ?",
            (entity_type, entity_id)
        ).fetchone()
        return json.loads(row["data"]) if row else None


def create_entity(entity_type: str, data: dict) -> dict:
    entity_id = str(uuid.uuid4())
    now = _now()
    record = {**data, "id": entity_id, "created_date": now, "updated_date": now}
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO entities (id, type, data, created_date, updated_date) VALUES (?, ?, ?, ?, ?)",
            (entity_id, entity_type, json.dumps(record), now, now)
        )
        conn.commit()
    return record


def update_entity(entity_type: str, entity_id: str, data: dict) -> dict | None:
    existing = get_entity(entity_type, entity_id)
    if not existing:
        return None
    now = _now()
    updated = {**existing, **data, "id": entity_id, "updated_date": now}
    with get_conn() as conn:
        conn.execute(
            "UPDATE entities SET data = ?, updated_date = ? WHERE type = ? AND id = ?",
            (json.dumps(updated), now, entity_type, entity_id)
        )
        conn.commit()
    return updated


def delete_entity(entity_type: str, entity_id: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM entities WHERE type = ? AND id = ?", (entity_type, entity_id))
        conn.commit()


def filter_entities(entity_type: str, query: dict, sort: str = None, limit: int = None) -> list:
    items = list_entities(entity_type, sort, limit)

    def matches(item: dict) -> bool:
        for key, condition in query.items():
            val = item.get(key)
            if isinstance(condition, dict):
                for op, op_val in condition.items():
                    if op == "$gte" and (val is None or val < op_val):
                        return False
                    elif op == "$lte" and (val is None or val > op_val):
                        return False
                    elif op == "$in" and val not in op_val:
                        return False
            else:
                if val != condition:
                    return False
        return True

    return [item for item in items if matches(item)]


# ── Domain seed data ───────────────────────────────────────────────────────────

DEFAULT_DOMAINS = [
    {
        "domain_key": "electrochemistry",
        "display_name": "Electrochemistry",
        "description": "Mathematical formalization of electrochemical phenomena, electrode kinetics, and charge transfer.",
        "color_accent": "#0ea5e9",
        "core_math_branches": ["Differential equations", "Thermodynamics", "Complex analysis"],
        "key_equations": ["E = E° - (RT/nF)·ln(Q)", "i = i₀(exp(αFη/RT) - exp(-(1-α)Fη/RT))", "Q = It"],
    },
    {
        "domain_key": "thermochemistry",
        "display_name": "Thermochemistry",
        "description": "Mathematical treatment of heat, energy, and thermodynamic state functions in chemical systems.",
        "color_accent": "#f97316",
        "core_math_branches": ["Calculus", "Statistical mechanics", "Linear algebra"],
        "key_equations": ["dG = dH - TdS", "ΔG° = -RT·ln(K)", "Cp = (∂H/∂T)p"],
    },
    {
        "domain_key": "kinetics",
        "display_name": "Kinetics",
        "description": "Mathematical description of reaction rates, mechanisms, and time evolution of chemical systems.",
        "color_accent": "#22c55e",
        "core_math_branches": ["Differential equations", "Linear algebra", "Probability theory"],
        "key_equations": ["d[A]/dt = -k[A]ⁿ", "k = A·exp(-Ea/RT)", "t½ = ln(2)/k"],
    },
    {
        "domain_key": "organic_chemistry",
        "display_name": "Organic Chemistry",
        "description": "Graph-theoretic and topological formalization of molecular structure and organic reactions.",
        "color_accent": "#a855f7",
        "core_math_branches": ["Graph theory", "Topology", "Group theory"],
        "key_equations": ["M = (V, E, λ, β)", "χ = V - E + F", "Hückel: E = α + mβ"],
    },
    {
        "domain_key": "quantum_chemistry",
        "display_name": "Quantum Chemistry",
        "description": "Operator algebra and eigenvalue equations governing electronic structure and molecular properties.",
        "color_accent": "#ec4899",
        "core_math_branches": ["Linear algebra", "Functional analysis", "Group theory"],
        "key_equations": ["Ĥψ = Eψ", "E = ⟨ψ|Ĥ|ψ⟩/⟨ψ|ψ⟩", "∇²ψ + (8π²m/h²)(E-V)ψ = 0"],
    },
    {
        "domain_key": "stoichiometry",
        "display_name": "Stoichiometry",
        "description": "Linear algebraic formalization of mass balance, conservation laws, and chemical equation balancing.",
        "color_accent": "#eab308",
        "core_math_branches": ["Linear algebra", "Number theory", "Combinatorics"],
        "key_equations": ["Ax = 0 → null(A)", "Σnᵢ·Mᵢ = 0", "yield = actual/theoretical × 100%"],
    },
]


def _seed_domains():
    existing = list_entities("DomainDefinition")
    if existing:
        return
    for d in DEFAULT_DOMAINS:
        create_entity("DomainDefinition", d)
