import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled (no user) and manual admin invocation
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch {
      // Called from scheduler — no user session, allow it
      isAdmin = true;
    }

    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a world news analyst. Generate a list of 10 of the most important and trending global hot issues as of today (${new Date().toISOString().slice(0, 10)}).

For each issue provide:
- headline: A concise, impactful headline (max 15 words)
- summary: A clear, factual 2-3 sentence summary suitable for English language learners preparing for exams
- source_name: A reputable news source name (e.g. BBC, Reuters, CNN, The Guardian, AP News)
- source_link: A plausible URL to a relevant article (use real domain like https://www.bbc.com/news/...)
- topic: One of: Politics, Technology, Environment, Economy, Society, Science, Health, Culture, Education, Security
- subtopic: A more specific sub-topic (e.g. Climate Change, Artificial Intelligence, Elections, Trade War)

Return exactly 10 issues covering a diverse range of topics. Make sure summaries are informative and educational.`,
      response_json_schema: {
        type: "object",
        properties: {
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string" },
                source_name: { type: "string" },
                source_link: { type: "string" },
                topic: { type: "string" },
                subtopic: { type: "string" }
              }
            }
          }
        }
      }
    });

    const issues = result.issues || [];

    // Delete old AI-generated issues before inserting new ones
    const existing = await base44.asServiceRole.entities.HotIssue.filter({ ai_generated: true });
    for (const item of existing) {
      await base44.asServiceRole.entities.HotIssue.delete(item.id);
    }

    // Insert new issues
    for (const issue of issues) {
      await base44.asServiceRole.entities.HotIssue.create({
        headline: issue.headline,
        summary: issue.summary,
        source_name: issue.source_name,
        source_link: issue.source_link,
        topic: issue.topic,
        subtopic: issue.subtopic,
        status: 'published',
        ai_generated: true
      });
    }

    return Response.json({ success: true, generated: issues.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});