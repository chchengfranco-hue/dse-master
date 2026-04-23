import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entity, operation, id, data } = await req.json();

    const allowedEntities = ['ReadingPassage', 'GrammarExercise', 'WritingModel', 'VocabSet', 'SpeakingExam', 'ClozeExercise'];
    const allowedOps = ['create', 'update', 'delete'];

    if (!allowedEntities.includes(entity) || !allowedOps.includes(operation)) {
      return Response.json({ error: 'Invalid entity or operation' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities[entity];

    let result;
    if (operation === 'create') result = await db.create(data);
    else if (operation === 'update') result = await db.update(id, data);
    else if (operation === 'delete') { await db.delete(id); result = { ok: true }; }

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});