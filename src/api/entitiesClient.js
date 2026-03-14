const API = "http://127.0.0.1:8000";

async function req(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

const entity = (name) => ({
  list: (sort, limit) => {
    const p = new URLSearchParams();
    if (sort) p.set("sort", sort);
    if (limit) p.set("limit", String(limit));
    const q = p.toString();
    return req(`/entities/${name}${q ? "?" + q : ""}`);
  },

  get: (id) => req(`/entities/${name}/${id}`),

  create: (data) =>
    req(`/entities/${name}`, { method: "POST", body: JSON.stringify(data) }),

  update: (id, data) =>
    req(`/entities/${name}/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  delete: (id) =>
    req(`/entities/${name}/${id}`, { method: "DELETE" }),

  filter: (query, sort, limit) =>
    req(`/entities/${name}/filter`, {
      method: "POST",
      body: JSON.stringify({ query, sort, limit }),
    }),

  // Polling-based subscribe — calls callback whenever new items appear
  subscribe: (callback) => {
    let active = true;
    let lastIds = new Set();

    const poll = async () => {
      if (!active) return;
      try {
        const items = await entity(name).list();
        const newItems = items.filter((i) => !lastIds.has(i.id));
        lastIds = new Set(items.map((i) => i.id));
        newItems.forEach((item) => callback({ type: "create", data: item }));
      } catch {}
      if (active) setTimeout(poll, 2000);
    };

    poll();
    return () => { active = false; };
  },
});

export const entities = {
  MathDictionary: entity("MathDictionary"),
  DomainDefinition: entity("DomainDefinition"),
  Mission: entity("Mission"),
};

export async function semanticSearch(query, { top_k = 10, domain = "all" } = {}) {
  return req("/semantic-search", {
    method: "POST",
    body: JSON.stringify({ query, top_k, domain }),
  });
}
