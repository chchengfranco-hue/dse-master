import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Fetch all saved questions from library
    const allExercises = await base44.asServiceRole.entities.GeoExercise.list('-updated_date', 500);
    
    const mcqQuestions = [];
    const dataBasedQuestions = [];
    const essayQuestions = [];
    const topicUsed = new Set();

    // Organize questions by type
    allExercises.forEach(ex => {
      if (ex.type === 'mcq' && ex.questions) {
        mcqQuestions.push(...ex.questions.map(q => ({ ...q, topic: ex.topic })));
      } else if (ex.type === 'data_based' && ex.questions) {
        dataBasedQuestions.push(...ex.questions.map(q => ({ ...q, topic: ex.topic })));
      } else if (ex.type === 'short_essay' && ex.questions) {
        essayQuestions.push(...ex.questions.map(q => ({ ...q, topic: ex.topic })));
      }
    });

    // Select 20 MCQs
    const selectedMCQs = mcqQuestions.slice(0, 20);

    // Select 3 data-based from different topics
    const selectedDataBased = [];
    dataBasedQuestions.forEach(q => {
      if (selectedDataBased.length < 3 && !topicUsed.has(q.topic)) {
        selectedDataBased.push(q);
        topicUsed.add(q.topic);
      }
    });

    // Select 4 essays from different topics
    const selectedEssays = [];
    topicUsed.clear();
    essayQuestions.forEach(q => {
      if (selectedEssays.length < 4 && !topicUsed.has(q.topic)) {
        selectedEssays.push(q);
        topicUsed.add(q.topic);
      }
    });

    // If not enough questions, fill with any available
    while (selectedDataBased.length < 3 && dataBasedQuestions.length > selectedDataBased.length) {
      const q = dataBasedQuestions.find(dq => !selectedDataBased.includes(dq));
      if (q) selectedDataBased.push(q);
    }

    while (selectedEssays.length < 4 && essayQuestions.length > selectedEssays.length) {
      const q = essayQuestions.find(eq => !selectedEssays.includes(eq));
      if (q) selectedEssays.push(q);
    }

    const mockTest = {
      mcq: selectedMCQs,
      dataBased: selectedDataBased,
      essay: selectedEssays,
      generatedAt: new Date().toISOString(),
    };

    return Response.json({ success: true, mockTest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});