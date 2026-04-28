import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXERCISE_PROMPTS = {
  mcq: `Generate 5 bilingual HKDSE Geography MCQ questions on the topic. 
Each question must have 4 options (A/B/C/D), a correct answer, and a brief explanation.
Present each question FIRST in English, then the SAME question in Traditional Chinese (繁體中文).
Same for options and explanation.`,

  data_based: `Generate 2 bilingual HKDSE Geography data-based questions on the topic.
Each question should reference a hypothetical dataset, table, or graph (describe it briefly), then ask 3 sub-questions (a, b, c) with mark allocations.
Present each question FIRST in English, then the SAME content in Traditional Chinese (繁體中文).
Include model answers for each sub-question.`,

  short_essay: `Generate 3 bilingual HKDSE Geography short essay questions on the topic.
Each should be a structured question worth 8–10 marks with guidance on what to include.
Present each question FIRST in English, then the SAME question in Traditional Chinese (繁體中文).
Include a model answer outline in both languages.`,
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { topic, type } = await req.json();

  if (!topic || !type || !EXERCISE_PROMPTS[type]) {
    return Response.json({ error: 'Invalid topic or type' }, { status: 400 });
  }

  const schemaByType = {
    mcq: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question_en: { type: 'string' },
              question_zh: { type: 'string' },
              options_en: { type: 'array', items: { type: 'string' } },
              options_zh: { type: 'array', items: { type: 'string' } },
              correct: { type: 'string', description: 'A, B, C, or D' },
              explanation_en: { type: 'string' },
              explanation_zh: { type: 'string' },
            }
          }
        }
      }
    },
    data_based: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context_en: { type: 'string', description: 'Description of the data/table/graph' },
              context_zh: { type: 'string' },
              sub_questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'a, b, or c' },
                    question_en: { type: 'string' },
                    question_zh: { type: 'string' },
                    marks: { type: 'number' },
                    answer_en: { type: 'string' },
                    answer_zh: { type: 'string' },
                  }
                }
              }
            }
          }
        }
      }
    },
    short_essay: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question_en: { type: 'string' },
              question_zh: { type: 'string' },
              marks: { type: 'number' },
              guidance_en: { type: 'string' },
              guidance_zh: { type: 'string' },
              model_answer_en: { type: 'string' },
              model_answer_zh: { type: 'string' },
            }
          }
        }
      }
    }
  };

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    model: 'claude_sonnet_4_6',
    prompt: `You are an expert HKDSE Geography teacher in Hong Kong with deep knowledge of the DSE Geography curriculum.
Topic: ${topic}

${EXERCISE_PROMPTS[type]}

Important:
- All questions must be appropriate for HKDSE level (Form 4-6)
- Use proper geographic terminology in both English and Traditional Chinese
- Ensure questions test higher-order thinking (analysis, evaluation)
- Follow the HKDSE Geography marking scheme style`,
    response_json_schema: schemaByType[type],
  });

  return Response.json({ success: true, type, topic, data: result });
});