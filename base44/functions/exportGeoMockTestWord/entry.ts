import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { mockTest } = body;

  if (!mockTest) {
    return Response.json({ error: 'No mock test provided' }, { status: 400 });
  }

  try {
    // Generate HTML content
    let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>HKDSE Geography Mock Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #0066cc; margin-top: 30px; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
        .question { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #0066cc; }
        .question p { margin: 5px 0; }
        .chinese { color: #666; font-size: 0.9em; }
        .options { margin-left: 20px; margin-top: 10px; }
        .option { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>HKDSE Geography Mock Test</h1>
      <p style="text-align: center; color: #666;">中學文憑試地理科模擬試卷</p>
    `;

    // MCQ Section
    html += `<h2>Section A: Multiple Choice Questions (${mockTest.mcq?.length || 0} marks)</h2>`;
    mockTest.mcq?.forEach((q, i) => {
      html += `
        <div class="question">
          <p><strong>Question ${i + 1}</strong></p>
          <p>${q.question_en}</p>
          <p class="chinese">${q.question_zh}</p>
          <div class="options">
            ${q.options_en?.map((opt, j) => `<div class="option">${String.fromCharCode(65 + j)}) ${opt}</div>`).join('')}
          </div>
        </div>
      `;
    });

    // Data-based Section
    html += `<h2>Section B: Data-based Questions (${mockTest.dataBased?.length || 0} questions)</h2>`;
    mockTest.dataBased?.forEach((q, i) => {
      html += `
        <div class="question">
          <p><strong>Question ${20 + i + 1}</strong></p>
          <p>${q.context_en}</p>
          <p class="chinese">${q.context_zh}</p>
      `;
      q.sub_questions?.forEach(sq => {
        html += `
          <p style="margin-top: 10px;"><strong>(${sq.label})</strong> ${sq.question_en} [${sq.marks} marks]</p>
          <p class="chinese">${sq.question_zh}</p>
        `;
      });
      html += `</div>`;
    });

    // Essay Section
    html += `<h2>Section C: Short Essays (${mockTest.essay?.length || 0} questions)</h2>`;
    mockTest.essay?.forEach((q, i) => {
      html += `
        <div class="question">
          <p><strong>Question ${23 + i + 1} [${q.marks} marks]</strong></p>
          <p>${q.question_en}</p>
          <p class="chinese">${q.question_zh}</p>
          <p style="margin-top: 10px; font-size: 0.9em; color: #666;"><strong>Guidance:</strong> ${q.guidance_en}</p>
        </div>
      `;
    });

    html += `</body></html>`;

    // Convert HTML to Word (.docx) via integration
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ 
      file: html 
    });

    return Response.json({ 
      success: true, 
      download_url: file_url 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});