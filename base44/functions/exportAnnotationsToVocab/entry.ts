import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, topic, subtopic, words } = await req.json();

  if (!words || words.length === 0) {
    return Response.json({ error: 'No words provided' }, { status: 400 });
  }

  // Use LLM to enrich each word with PoS, meaning, example
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an English vocabulary expert for HKDSE students in Hong Kong.
For each of the following words/phrases, provide:
1. Part of speech (use exactly: n. / v. / adj. / adv. / phrase)
2. A concise meaning suitable for HKDSE level (max 8 words)
3. A clear example sentence (max 15 words, academic/formal register)

Words: ${words.join(', ')}

Return ONLY a JSON object matching the schema. For multi-word phrases, treat them as single entries.`,
    response_json_schema: {
      type: 'object',
      properties: {
        vocab: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              pos: { type: 'string' },
              meaning: { type: 'string' },
              example: { type: 'string' }
            }
          }
        }
      }
    }
  });

  const vocabData = (result.vocab || []).filter(v => v.word && v.meaning);

  // Create VocabSet
  const created = await base44.asServiceRole.entities.VocabSet.create({
    title: title || 'Exported Vocabulary',
    topic: topic || 'General',
    subtopic: subtopic || 'General',
    custom_code: '',
    passage: '',
    vocab_data: vocabData,
    status: 'draft',
    is_published: false,
  });

  return Response.json({ success: true, id: created.id, count: vocabData.length });
});