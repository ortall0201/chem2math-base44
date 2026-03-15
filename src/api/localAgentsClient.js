const BACKEND_URL = "http://127.0.0.1:8000";

export const localAgents = {
  async createConversation({ agent_name, metadata = {} }) {
    const res = await fetch(`${BACKEND_URL}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_name, metadata }),
    });
    if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
    return res.json();
  },

  async listConversations({ agent_name } = {}) {
    const url = agent_name
      ? `${BACKEND_URL}/conversations?agent_name=${encodeURIComponent(agent_name)}`
      : `${BACKEND_URL}/conversations`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async getConversation(id) {
    const res = await fetch(`${BACKEND_URL}/conversations/${id}`);
    if (!res.ok) throw new Error(`Conversation not found: ${id}`);
    return res.json();
  },

  /**
   * Send a message and stream the response.
   *
   * Calls:
   *   onChunk(text)   — called with each text token as it arrives
   *   onEntry(entry)  — called when the agent saves a dictionary entry
   *   onDone(msgs)    — called with the full messages array when streaming ends
   *   onError(msg)    — called if something goes wrong
   */
  async teamCommunication(prompt, { onRoundStart, onAgentStart, onAgentChunk, onAgentDone, onToolCall, onDataFetchStart, onDataFetchResult, onDataFetchDone, onDone, onError } = {}) {
    const res = await fetch(`${BACKEND_URL}/team-communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const err = `Backend error ${res.status}`;
      onError?.(err);
      throw new Error(err);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "round_start") onRoundStart?.(event);
          else if (event.type === "agent_start") onAgentStart?.(event);
          else if (event.type === "agent_chunk") onAgentChunk?.(event);
          else if (event.type === "agent_done") onAgentDone?.(event);
          else if (event.type === "tool_call") onToolCall?.(event);
          else if (event.type === "data_fetch_start") onDataFetchStart?.(event);
          else if (event.type === "data_fetch_result") onDataFetchResult?.(event);
          else if (event.type === "data_fetch_done") onDataFetchDone?.(event);
          else if (event.type === "done") onDone?.(event);
          else if (event.type === "error") onError?.(event.message);
        } catch { /* ignore malformed */ }
      }
    }
  },

  async chat(conv, content, { onChunk, onEntry, onDone, onError } = {}) {
    const res = await fetch(`${BACKEND_URL}/conversations/${conv.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content }),
    });

    if (!res.ok) {
      const err = `Backend error ${res.status}`;
      onError?.(err);
      throw new Error(err);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep the incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "chunk") onChunk?.(event.content);
          else if (event.type === "tool_call") onEntry?.(event.entry);
          else if (event.type === "done") onDone?.(event.messages);
          else if (event.type === "error") onError?.(event.message);
        } catch {
          // malformed SSE line — ignore
        }
      }
    }
  },
};
