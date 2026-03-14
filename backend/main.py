import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

from agent_configs import AGENT_CONFIGS, SAVE_ENTRY_TOOL
from database import (
    init_db,
    create_conversation, get_conversation, list_conversations, add_message, get_messages,
    list_entities, get_entity, create_entity, update_entity, delete_entity, filter_entities,
)

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Agent conversation models ─────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    agent_name: str
    metadata: dict = {}


class AddMessageRequest(BaseModel):
    role: str
    content: str


# ── Agent conversation routes ─────────────────────────────────────────────────

@app.post("/conversations")
def create_conv(req: CreateConversationRequest):
    if req.agent_name not in AGENT_CONFIGS:
        raise HTTPException(400, f"Unknown agent: {req.agent_name}")
    return create_conversation(req.agent_name, req.metadata)


@app.get("/conversations")
def list_convs(agent_name: str = None):
    return list_conversations(agent_name)


@app.get("/conversations/{conv_id}")
def get_conv(conv_id: str):
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return conv


@app.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, req: AddMessageRequest):
    conv = get_conversation(conv_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    agent_config = AGENT_CONFIGS.get(conv["agent_name"])
    if not agent_config:
        raise HTTPException(400, f"Unknown agent: {conv['agent_name']}")

    add_message(conv_id, "user", req.content)

    messages = [{"role": "system", "content": agent_config["system_prompt"]}]
    for msg in get_messages(conv_id):
        messages.append({"role": msg["role"], "content": msg["content"]})

    return StreamingResponse(
        _agent_stream(conv_id, messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Entity CRUD routes ────────────────────────────────────────────────────────

@app.get("/entities/{entity_name}")
def list_entity(entity_name: str, sort: str = None, limit: int = None):
    return list_entities(entity_name, sort, limit)


@app.get("/entities/{entity_name}/{item_id}")
def get_entity_route(entity_name: str, item_id: str):
    item = get_entity(entity_name, item_id)
    if not item:
        raise HTTPException(404, f"{entity_name} not found")
    return item


@app.post("/entities/{entity_name}/filter")
def filter_entity(entity_name: str, body: dict):
    return filter_entities(
        entity_name,
        body.get("query", {}),
        body.get("sort"),
        body.get("limit"),
    )


@app.post("/entities/{entity_name}")
def create_entity_route(entity_name: str, data: dict, background_tasks: BackgroundTasks):
    record = create_entity(entity_name, data)
    if entity_name == "MathDictionary":
        background_tasks.add_task(_embed_entry, record["id"])
    return record


@app.put("/entities/{entity_name}/{item_id}")
def update_entity_route(entity_name: str, item_id: str, data: dict):
    record = update_entity(entity_name, item_id, data)
    if not record:
        raise HTTPException(404, f"{entity_name} not found")
    return record


@app.delete("/entities/{entity_name}/{item_id}")
def delete_entity_route(entity_name: str, item_id: str):
    delete_entity(entity_name, item_id)
    return {"success": True}


# ── Semantic search ───────────────────────────────────────────────────────────

@app.post("/semantic-search")
def semantic_search(body: dict):
    query_text = body.get("query", "")
    top_k = body.get("top_k", 10)
    domain = body.get("domain", "all")

    emb = client.embeddings.create(model="text-embedding-3-small", input=query_text)
    query_vec = emb.data[0].embedding

    all_entries = list_entities("MathDictionary")
    candidates = [e for e in all_entries if e.get("embedding")]
    if domain and domain != "all":
        candidates = [e for e in candidates if e.get("domain") == domain]

    def cosine(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        na = sum(x * x for x in a) ** 0.5
        nb = sum(x * x for x in b) ** 0.5
        return dot / (na * nb) if na * nb else 0

    scored = sorted(
        [{**{k: v for k, v in e.items() if k != "embedding"}, "score": cosine(query_vec, e["embedding"])} for e in candidates],
        key=lambda x: x["score"],
        reverse=True,
    )[:top_k]

    return {"results": scored, "total_searched": len(candidates)}


# ── Background: auto-embed MathDictionary entries ─────────────────────────────

def _embed_entry(entry_id: str):
    entry = get_entity("MathDictionary", entry_id)
    if not entry:
        return
    text = "\n".join(filter(None, [
        f"Domain: {entry.get('domain', '')}",
        f"Concept: {entry.get('concept_name', '')}",
        f"Chemistry notation: {entry.get('chemistry_notation', '')}" if entry.get("chemistry_notation") else "",
        f"Math formalism: {entry.get('math_formalism', '')}",
        f"Natural language: {entry.get('natural_language', '')}" if entry.get("natural_language") else "",
        f"Prediction potential: {entry.get('prediction_potential', '')}" if entry.get("prediction_potential") else "",
    ]))
    try:
        emb = client.embeddings.create(model="text-embedding-3-small", input=text)
        update_entity("MathDictionary", entry_id, {"embedding": emb.data[0].embedding})
    except Exception as e:
        print(f"Embedding failed for {entry_id}: {e}")


# ── Team Communication ────────────────────────────────────────────────────────

class TeamCommunicationRequest(BaseModel):
    prompt: str


@app.post("/team-communication")
def team_communication_route(req: TeamCommunicationRequest):
    mission = create_entity("Mission", {
        "prompt": req.prompt,
        "agent_keys": list(AGENT_CONFIGS.keys()),
        "status": "active",
        "entries_saved": 0,
        "mode": "team_communication",
    })
    return StreamingResponse(
        _team_communication_stream(req.prompt, mission["id"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _run_agent_turn(messages: list):
    """Run one LLM turn with tool loop. Yields ("chunk", text) | ("tool_call", entry) | ("done", full_text)."""
    full_text = ""
    while True:
        accumulated_text = ""
        tool_calls_raw = []
        stream = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=[SAVE_ENTRY_TOOL],
            tool_choice="auto",
            stream=True,
        )
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                accumulated_text += delta.content
                yield ("chunk", delta.content)
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    while idx >= len(tool_calls_raw):
                        tool_calls_raw.append({"id": "", "name": "", "arguments": ""})
                    if tc.id:
                        tool_calls_raw[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            tool_calls_raw[idx]["name"] = tc.function.name
                        if tc.function.arguments:
                            tool_calls_raw[idx]["arguments"] += tc.function.arguments
        full_text += accumulated_text
        if not tool_calls_raw:
            break
        assistant_msg = {
            "role": "assistant",
            "content": accumulated_text or None,
            "tool_calls": [
                {"id": tc["id"], "type": "function", "function": {"name": tc["name"], "arguments": tc["arguments"]}}
                for tc in tool_calls_raw
            ],
        }
        messages.append(assistant_msg)
        for tc in tool_calls_raw:
            if tc["name"] == "save_math_dictionary_entry":
                try:
                    entry = json.loads(tc["arguments"])
                    entry.setdefault("status", "draft")
                    saved = create_entity("MathDictionary", entry)
                    _embed_entry(saved["id"])
                    yield ("tool_call", saved)
                    result = json.dumps({"success": True, "concept_name": saved.get("concept_name", "")})
                except json.JSONDecodeError as e:
                    result = json.dumps({"error": f"Invalid JSON: {e}"})
            else:
                result = json.dumps({"error": f"Unknown tool: {tc['name']}"})
            messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})
    yield ("done", full_text)


def _team_communication_stream(prompt: str, mission_id: str):
    agent_keys = [k for k in AGENT_CONFIGS if k != "synthesis_agent"]
    try:
        # ── Round 1: Each agent independently formalizes the concept ─────────
        yield f"data: {json.dumps({'type': 'round_start', 'round': 1, 'label': 'Round 1 — Domain Experts'})}\n\n"
        round1_responses = {}

        for agent_key in agent_keys:
            config = AGENT_CONFIGS[agent_key]
            yield f"data: {json.dumps({'type': 'agent_start', 'agent_key': agent_key, 'codename': config['name']})}\n\n"
            messages = [
                {"role": "system", "content": config["system_prompt"]},
                {"role": "user", "content": prompt},
            ]
            for evt, data in _run_agent_turn(messages):
                if evt == "chunk":
                    yield f"data: {json.dumps({'type': 'agent_chunk', 'agent_key': agent_key, 'content': data})}\n\n"
                elif evt == "tool_call":
                    yield f"data: {json.dumps({'type': 'tool_call', 'agent_key': agent_key, 'entry': data})}\n\n"
                elif evt == "done":
                    round1_responses[agent_key] = data
            yield f"data: {json.dumps({'type': 'agent_done', 'agent_key': agent_key})}\n\n"

        # ── Round 2: Each agent reads all colleagues and finds bridges ────────
        yield f"data: {json.dumps({'type': 'round_start', 'round': 2, 'label': 'Round 2 — Cross-Domain Debate'})}\n\n"
        round2_responses = {}

        for agent_key in agent_keys:
            config = AGENT_CONFIGS[agent_key]
            yield f"data: {json.dumps({'type': 'agent_start', 'agent_key': agent_key, 'codename': config['name']})}\n\n"
            others = "\n\n".join([
                f"{AGENT_CONFIGS[k]['name']} ({AGENT_CONFIGS[k]['domain']}):\n{resp}"
                for k, resp in round1_responses.items() if k != agent_key
            ])
            cross_prompt = (
                f"Original question: {prompt}\n\n"
                f"Your Round 1 response:\n{round1_responses.get(agent_key, '')}\n\n"
                f"What your colleagues said in Round 1:\n{others}\n\n"
                f"Now respond directly to your colleagues: Where do your formalisms connect with theirs? "
                f"Are your equations secretly the same thing expressed differently? "
                f"What mathematical bridges exist between your domain and theirs? "
                f"Save any new cross-domain connections you discover as dictionary entries."
            )
            messages = [
                {"role": "system", "content": config["system_prompt"]},
                {"role": "user", "content": cross_prompt},
            ]
            for evt, data in _run_agent_turn(messages):
                if evt == "chunk":
                    yield f"data: {json.dumps({'type': 'agent_chunk', 'agent_key': agent_key, 'content': data})}\n\n"
                elif evt == "tool_call":
                    yield f"data: {json.dumps({'type': 'tool_call', 'agent_key': agent_key, 'entry': data})}\n\n"
                elif evt == "done":
                    round2_responses[agent_key] = data
            yield f"data: {json.dumps({'type': 'agent_done', 'agent_key': agent_key})}\n\n"

        # ── Round 3: Maxwell synthesizes the full conversation ────────────────
        yield f"data: {json.dumps({'type': 'round_start', 'round': 3, 'label': 'Round 3 — Maxwell Synthesizes'})}\n\n"
        yield f"data: {json.dumps({'type': 'agent_start', 'agent_key': 'synthesis_agent', 'codename': 'Maxwell'})}\n\n"

        full_debate = "\n\n---\n\n".join([
            f"{AGENT_CONFIGS[k]['name']}:\n"
            f"[Round 1] {round1_responses.get(k, '')}\n\n"
            f"[Round 2 — cross-domain] {round2_responses.get(k, '')}"
            for k in agent_keys
        ])
        synth_prompt = (
            f"Original mission: {prompt}\n\n"
            f"Full team debate:\n{full_debate}\n\n"
            f"You are the final synthesizer. Based on everything your 6 colleagues debated, "
            f"identify the deepest unified mathematical structures, universal operators, and conservation laws "
            f"that span ALL domains. Where are they secretly the same equation? "
            f"Save the most important cross-domain unifications as dictionary entries, then write your synthesis."
        )
        messages = [
            {"role": "system", "content": AGENT_CONFIGS["synthesis_agent"]["system_prompt"]},
            {"role": "user", "content": synth_prompt},
        ]
        for evt, data in _run_agent_turn(messages):
            if evt == "chunk":
                yield f"data: {json.dumps({'type': 'agent_chunk', 'agent_key': 'synthesis_agent', 'content': data})}\n\n"
            elif evt == "tool_call":
                yield f"data: {json.dumps({'type': 'tool_call', 'agent_key': 'synthesis_agent', 'entry': data})}\n\n"
            elif evt == "done":
                yield f"data: {json.dumps({'type': 'agent_done', 'agent_key': 'synthesis_agent'})}\n\n"

        update_entity("Mission", mission_id, {"status": "completed"})
        yield f"data: {json.dumps({'type': 'done', 'mission_id': mission_id})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


# ── Streaming agent loop ──────────────────────────────────────────────────────

def _agent_stream(conv_id: str, messages: list):
    full_response_text = ""
    try:
        while True:
            accumulated_text = ""
            tool_calls_raw = []

            stream = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=[SAVE_ENTRY_TOOL],
                tool_choice="auto",
                stream=True,
            )

            for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta

                if delta.content:
                    accumulated_text += delta.content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': delta.content})}\n\n"

                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        while idx >= len(tool_calls_raw):
                            tool_calls_raw.append({"id": "", "name": "", "arguments": ""})
                        if tc.id:
                            tool_calls_raw[idx]["id"] = tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls_raw[idx]["name"] = tc.function.name
                            if tc.function.arguments:
                                tool_calls_raw[idx]["arguments"] += tc.function.arguments

            full_response_text += accumulated_text

            if not tool_calls_raw:
                break

            assistant_msg = {
                "role": "assistant",
                "content": accumulated_text or None,
                "tool_calls": [
                    {"id": tc["id"], "type": "function", "function": {"name": tc["name"], "arguments": tc["arguments"]}}
                    for tc in tool_calls_raw
                ],
            }
            messages.append(assistant_msg)

            for tc in tool_calls_raw:
                if tc["name"] == "save_math_dictionary_entry":
                    try:
                        entry = json.loads(tc["arguments"])
                        entry.setdefault("status", "draft")
                        # Save directly to our DB
                        saved = create_entity("MathDictionary", entry)
                        _embed_entry(saved["id"])
                        yield f"data: {json.dumps({'type': 'tool_call', 'entry': saved})}\n\n"
                        result = json.dumps({"success": True, "concept_name": saved.get("concept_name", "")})
                    except json.JSONDecodeError as e:
                        result = json.dumps({"error": f"Invalid JSON: {e}"})
                else:
                    result = json.dumps({"error": f"Unknown tool: {tc['name']}"})

                messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})

        if full_response_text:
            add_message(conv_id, "assistant", full_response_text)

        yield f"data: {json.dumps({'type': 'done', 'messages': get_messages(conv_id)})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
