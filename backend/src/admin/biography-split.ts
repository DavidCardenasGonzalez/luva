import { getSsmSecret } from '../memory/secrets';

// Splits a character's long-form biography into atomic, self-contained facts.
// Each fact becomes its own vector in Pinecone so the chat can semantically
// retrieve only the parts relevant to the current message, instead of dumping
// the whole biography into every prompt.
const DEFAULT_MODEL = 'gpt-5.4-nano';

async function getOpenAiKey(): Promise<string> {
  const direct = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (direct?.trim()) return direct.trim();
  const name = process.env.OPENAI_KEY_PARAM;
  if (!name) throw new Error('OPENAI_KEY_PARAM not set');
  return getSsmSecret(name);
}

export async function splitBiographyIntoFacts(biography: string): Promise<string[]> {
  const text = (biography || '').trim();
  if (!text) return [];

  const apiKey = await getOpenAiKey();
  const model = process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || DEFAULT_MODEL;
  const timeoutMs = Number(process.env.BIOGRAPHY_SPLIT_TIMEOUT_MS || 60000);
  const isGpt5 = /gpt-5/i.test(model);
  const useResponses = isGpt5 || process.env.OPENAI_USE_RESPONSES === '1';
  const reasoningConfig = isGpt5
    ? { effort: process.env.OPENAI_REASONING_EFFORT || 'low' }
    : undefined;

  const systemPrompt = `You split a fictional character's biography into atomic, self-contained facts for a vector memory database.

These facts are embedded separately and retrieved individually during chats so the character can recall only the relevant parts of its background.

Rules:
- Output ONLY JSON with this exact shape: { "facts": ["...", "..."] }
- Each fact is ONE concise, self-contained statement that makes sense on its own (resolve pronouns: write the character's name/role, not "he/she/they").
- Split distinct pieces of information (origin, family, job, personality, hobbies, relationships, history, goals) into separate facts.
- Do NOT invent anything. Only restate what the biography says.
- Keep each fact under 300 characters.
- Return at most 40 facts. If the biography is empty or meaningless, return { "facts": [] }.`;

  const userPrompt = `Biography:\n${text}\n\nSplit it into atomic facts as JSON.`;

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [{ role: 'user', content: [{ type: 'input_text', text: userPrompt }] }],
        max_output_tokens: Number(process.env.BIOGRAPHY_SPLIT_MAX_OUTPUT_TOKENS || 2000),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`BIOGRAPHY_SPLIT_HTTP_${res.status}_${payload?.error?.message || ''}`);
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && typeof payload?.output_text === 'string') raw = payload.output_text;
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: Number(process.env.BIOGRAPHY_SPLIT_MAX_OUTPUT_TOKENS || 2000),
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`BIOGRAPHY_SPLIT_HTTP_${res.status}_${(await res.text()).slice(0, 120)}`);
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') throw new Error('BIOGRAPHY_SPLIT_TIMEOUT');
    throw err;
  } finally {
    clearTimeout(to);
  }

  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  const jsonText = jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;

  const facts: string[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    const list = Array.isArray(parsed?.facts) ? parsed.facts : [];
    for (const item of list) {
      const fact = typeof item === 'string' ? item.trim() : '';
      if (fact) facts.push(fact.slice(0, 300));
      if (facts.length >= 40) break;
    }
  } catch {
    return [];
  }
  return facts;
}
