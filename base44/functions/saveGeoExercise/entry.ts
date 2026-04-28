import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type, topic, questions, source } = await req.json();

  if (!type || !topic || !questions || questions.length === 0) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const exerciseData = {
    title: `${topic} - ${type.replace('_', ' ').toUpperCase()}`,
    topic: topic,
    type: type,
    source: source || 'manual',
    questions: questions,
    status: 'published'
  };

  const saved = await base44.asServiceRole.entities.GeoExercise.create(exerciseData);

  return Response.json({ success: true, exercise_id: saved.id });
});