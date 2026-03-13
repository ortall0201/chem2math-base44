import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Cosine similarity between two vectors
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { query, top_k = 10, domain } = await req.json();

  if (!query || typeof query !== 'string') {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  // 1. Embed the query
  const embResp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
  });

  if (!embResp.ok) {
    const err = await embResp.text();
    return Response.json({ error: `OpenAI error: ${err}` }, { status: 500 });
  }

  const queryEmbedding = (await embResp.json()).data[0].embedding;

  // 2. Fetch all entries that have embeddings
  const allEntries = await base44.asServiceRole.entities.MathDictionary.list();
  const withEmbeddings = allEntries.filter(e => Array.isArray(e.embedding) && e.embedding.length > 0);

  if (withEmbeddings.length === 0) {
    return Response.json({ results: [], message: 'No embedded entries yet. Create some dictionary entries first.' });
  }

  // 3. Compute cosine similarity (FAISS-style in-memory nearest neighbor)
  const scored = withEmbeddings
    .filter(e => !domain || domain === 'all' || e.domain === domain)
    .map(entry => ({
      ...entry,
      embedding: undefined, // strip vector from response
      score: cosineSim(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top_k);

  return Response.json({ results: scored, total_searched: withEmbeddings.length });
});