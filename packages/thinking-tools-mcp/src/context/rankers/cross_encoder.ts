// Minimal Cohere Rerank (or mock) on top-50. Only runs if COHERE_API_KEY is set.
export async function ceRerankIfAvailable(q: string, items: { text: string }[]) {
  const key = process.env.COHERE_API_KEY;
  if (!key || items.length === 0) return null;
  const body = { model: 'rerank-english-v3.0', query: q, documents: items.map(i=>i.text) };
  const res = await fetch('https://api.cohere.ai/v1/rerank', {
    method: 'POST',
    headers: { 'content-type':'application/json', 'authorization':`Bearer ${key}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  // returns list of {index, relevance_score}
  return json?.results?.map((r:any)=>({ idx: r.index, score: r.relevance_score })) ?? null;
}

