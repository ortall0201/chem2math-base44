import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Called by entity automation on MathDictionary create/update
// Generates an OpenAI embedding for the entry and saves it back
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  // Accept both direct call {entry_id} and automation payload {event, data}
  const entryId = body.entry_id || body.event?.entity_id;
  const entryData = body.data;

  if (!entryId) {
    return Response.json({ error: 'Missing entry_id' }, { status: 400 });
  }

  // Fetch entry if not provided
  const entry = entryData || await base44.asServiceRole.entities.MathDictionary.get(entryId);
  if (!entry) {
    return Response.json({ error: 'Entry not found' }, { status: 404 });
  }

  // Build text to embed: combine key fields for rich semantic representation
  const text = [
    `Domain: ${entry.domain}`,
    `Concept: ${entry.concept_name}`,
    entry.chemistry_notation ? `Chemistry notation: ${entry.chemistry_notation}` : '',
    `Math formalism: ${entry.math_formalism}`,
    entry.natural_language ? `Natural language: ${entry.natural_language}` : '',
    entry.prediction_potential ? `Prediction potential: ${entry.prediction_potential}` : '',
    entry.relationships?.length ? `Related: ${entry.relationships.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  // Call OpenAI embeddings API
  const embResp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!embResp.ok) {
    const err = await embResp.text();
    return Response.json({ error: `OpenAI error: ${err}` }, { status: 500 });
  }

  const embData = await embResp.json();
  const embedding = embData.data[0].embedding;

  // Save embedding back to the entry
  await base44.asServiceRole.entities.MathDictionary.update(entryId, { embedding });

  return Response.json({ success: true, entry_id: entryId, dims: embedding.length });
});