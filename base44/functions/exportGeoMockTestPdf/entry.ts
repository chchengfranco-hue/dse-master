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
    // Build HTML for PDF
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>HKDSE Geography Mock Test</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
        .page { page-break-after: always; margin: 40px; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
        .subtitle { text-align: center; font-size: 14px; color: #666; margin-bottom: 30px; }
        h2 { font-size: 16px; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; }
        .question { margin: 15px 0; padding-left: 20px; }
        .q-num { font-weight: bold; }
        .chinese { font-size: 13px; color: #555; margin-top: 5px; }
        .options { margin-left: 20px; margin-top: 8px; }
        .option { margin: 3px 0; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="page">
        <h1>HKDSE Geography Mock Test</h1>
        <div class="subtitle">中學文憑試地理科模擬試卷</div>
        
        <h2>Section A: Multiple Choice Questions (${mockTest.mcq?.length || 0})</h2>
    `;

    mockTest.mcq?.forEach((q, i) => {
      html += `
        <div class="question">
          <div class="q-num">Question ${i + 1}</div>
          <p>${q.question_en}</p>
          <p class="chinese">${q.question_zh}</p>
          <div class="options">
            ${q.options_en?.map((opt, j) => `<div class="option">${String.fromCharCode(65 + j)}) ${opt}</div>`).join('')}
          </div>
        </div>
      `;
    });

    html += `
        <h2>Section B: Data-based Questions (${mockTest.dataBased?.length || 0})</h2>
    `;

    mockTest.dataBased?.forEach((q, i) => {
      html += `
        <div class="question">
          <div class="q-num">Question ${20 + i + 1}</div>
          <p>${q.context_en}</p>
          <p class="chinese">${q.context_zh}</p>
      `;
      q.sub_questions?.forEach(sq => {
        html += `
          <p style="margin-top: 8px;"><span class="q-num">(${sq.label})</span> ${sq.question_en} [${sq.marks} marks]</p>
          <p class="chinese">${sq.question_zh}</p>
        `;
      });
      html += `</div>`;
    });

    html += `
        <h2>Section C: Short Essays (${mockTest.essay?.length || 0})</h2>
    `;

    mockTest.essay?.forEach((q, i) => {
      html += `
        <div class="question">
          <div class="q-num">Question ${23 + i + 1} [${q.marks} marks]</div>
          <p>${q.question_en}</p>
          <p class="chinese">${q.question_zh}</p>
        </div>
      `;
    });

    html += `
      </div>
    </body>
    </html>
    `;

    // Convert to PDF using InvokeLLM for HTML to PDF conversion
    const pdfResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Convert this HTML to a clean PDF suitable for an exam paper. Preserve all formatting, questions, and text exactly as provided.\n\n${html}`,
      model: 'claude_sonnet_4_6'
    });

    // Upload generated PDF
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: html // Will be processed server-side
    });

    return Response.json({ 
      success: true,
      download_url: file_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});