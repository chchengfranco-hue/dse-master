import { useState } from 'react';
import { Plus, X, ChevronDown, Upload, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GeoManualForm({ type, topic, onSubmit, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [expanded, setExpanded] = useState(0);
  const [dragActive, setDragActive] = useState({});

  const addQuestion = () => {
    if (type === 'mcq') {
      setQuestions([...questions, { question_en: '', question_zh: '', template: 'statements', options_en: ['', '', ''], options_zh: ['', '', ''], numOptions: 3, answers: { A: '', B: '', C: '', D: '' }, correct: 'A', explanation_en: '', explanation_zh: '', image_url: '', tableFormat: false, numTableColumns: 2, tableHeaders: ['', ''], tableData: [['', '', ''], ['', '', ''], ['', '', '']] }]);
    } else if (type === 'data_based') {
      setQuestions([...questions, { context_en: '', context_zh: '', sub_questions: [{ label: 'a', question_en: '', question_zh: '', marks: 0, answer_en: '', answer_zh: '' }], image_url: '' }]);
    } else {
      setQuestions([...questions, { question_en: '', question_zh: '', marks: 0, guidance_en: '', guidance_zh: '', model_answer_en: '', model_answer_zh: '', image_url: '' }]);
    }
    setExpanded(questions.length);
  };

  const handleImageUpload = async (qIdx, file) => {
    if (!file) return;
    const res = await base44.integrations.Core.UploadFile({ file });
    if (res.file_url) {
      updateQuestion(qIdx, 'image_url', res.file_url);
    }
  };

  const handleDrag = (e, qIdx, active) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [qIdx]: active });
  };

  const handleDrop = (e, qIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [qIdx]: false });
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      handleImageUpload(qIdx, file);
    }
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (qIdx, letter, value) => {
    const updated = [...questions];
    updated[qIdx].answers[letter] = value;
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, lang, value) => {
    const updated = [...questions];
    const arr = lang === 'en' ? updated[qIdx].options_en : updated[qIdx].options_zh;
    arr[oIdx] = value;
    setQuestions(updated);
  };

  const setNumOptions = (qIdx, num) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (num < q.options_en.length) {
      q.options_en = q.options_en.slice(0, num);
      q.options_zh = q.options_zh.slice(0, num);
    } else {
      while (q.options_en.length < num) {
        q.options_en.push('');
        q.options_zh.push('');
      }
    }
    q.numOptions = num;
    setQuestions(updated);
  };

  const addSubQuestion = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].sub_questions.push({ label: String.fromCharCode(97 + updated[qIdx].sub_questions.length), question_en: '', question_zh: '', marks: 0, answer_en: '', answer_zh: '' });
    setQuestions(updated);
  };

  const removeSubQuestion = (qIdx, subIdx) => {
    const updated = [...questions];
    updated[qIdx].sub_questions = updated[qIdx].sub_questions.filter((_, i) => i !== subIdx);
    setQuestions(updated);
  };

  const updateSubQuestion = (qIdx, subIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx].sub_questions[subIdx] = { ...updated[qIdx].sub_questions[subIdx], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = () => {
    if (questions.length === 0) return alert('Please add at least one question.');
    onSubmit({ type, topic, questions, source: 'manual' });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{topic}</h2>
          <p className="text-xs text-muted-foreground mt-1">{type.replace('_', ' ').toUpperCase()} • Manual Input</p>
        </div>
        <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="space-y-3">
        {questions.length === 0 && <p className="text-sm text-muted-foreground italic py-4">No questions yet. Click "Add Question" to start.</p>}

        {/* MCQ */}
        {type === 'mcq' && questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-muted/40 rounded-xl border border-border p-4">
            <button onClick={() => setExpanded(expanded === qIdx ? -1 : qIdx)} className="w-full flex items-center justify-between mb-3">
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Question {qIdx + 1}</p>
                <p className="text-xs text-muted-foreground">{q.question_en.slice(0, 50)}... <span className="text-primary font-semibold">{q.template === 'statements' ? '[Statements]' : '[Simple MCQ]'}</span></p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === qIdx ? 'rotate-180' : ''}`} />
            </button>

            {expanded === qIdx && (
              <>
                <div className="flex gap-2 mb-3 flex-wrap">
                  <button
                    onClick={() => updateQuestion(qIdx, 'template', 'statements')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${q.template === 'statements' ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
                  >
                    Evaluate Statements (1)(2)(3)(4)
                  </button>
                  <button
                    onClick={() => updateQuestion(qIdx, 'template', 'simple')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${q.template === 'simple' ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
                  >
                    Simple MCQ (A, B, C, D)
                  </button>
                </div>

                {q.template === 'statements' && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => updateQuestion(qIdx, 'tableFormat', false)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${!q.tableFormat ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
                    >
                      List Format
                    </button>
                    <button
                      onClick={() => updateQuestion(qIdx, 'tableFormat', true)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${q.tableFormat ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
                    >
                      Table Format
                    </button>
                  </div>
                )}

                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Question (English)" value={q.question_en} onChange={e => updateQuestion(qIdx, 'question_en', e.target.value)} />
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-3" placeholder="Question (中文)" value={q.question_zh} onChange={e => updateQuestion(qIdx, 'question_zh', e.target.value)} />

                <div className="mb-3">
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Reference Image (Optional)</label>
                  {q.image_url ? (
                    <div className="relative">
                      <img src={q.image_url} alt="Reference" className="w-full rounded-lg border border-border max-h-48 object-cover mb-2" />
                      <button type="button" onClick={() => updateQuestion(qIdx, 'image_url', '')} className="text-xs text-red-600 hover:text-red-700">Remove Image</button>
                    </div>
                  ) : (
                    <label 
                      className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive[qIdx] ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'}`}
                      onDragEnter={e => handleDrag(e, qIdx, true)}
                      onDragLeave={e => handleDrag(e, qIdx, false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, qIdx)}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        <span>Click or drag image here</span>
                      </div>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(qIdx, e.target.files?.[0])} className="hidden" />
                    </label>
                  )}
                </div>

                {q.template === 'statements' && !q.tableFormat && (
                   <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground">Statements to Evaluate</p>
                      <div className="flex gap-1">
                        {[3, 4].map(num => (
                          <button
                            key={num}
                            onClick={() => setNumOptions(qIdx, num)}
                            className={`px-2 py-0.5 text-xs font-semibold rounded border transition-colors ${(q.numOptions || 3) === num ? 'bg-primary text-white border-primary' : 'bg-muted border-border hover:bg-border'}`}
                          >
                            {num} Statement{num > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {q.options_en.map((opt, oIdx) => (
                        <div key={oIdx} className="bg-background border-2 border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">({oIdx + 1})</span>
                            <span className="text-xs text-muted-foreground">Statement ({oIdx + 1})</span>
                          </div>
                          <input className="w-full rounded border border-input px-2 py-1.5 text-xs mb-1.5" placeholder="English statement" value={q.options_en[oIdx]} onChange={e => updateOption(qIdx, oIdx, 'en', e.target.value)} />
                          <input className="w-full rounded border border-input px-2 py-1.5 text-xs" placeholder="中文陳述" value={q.options_zh[oIdx]} onChange={e => updateOption(qIdx, oIdx, 'zh', e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.template === 'statements' && q.tableFormat && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Table Format</p>
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">Number of Columns</p>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={q.numTableColumns || 2}
                          onChange={e => {
                            const numCols = parseInt(e.target.value) || 2;
                            const newHeaders = [...(q.tableHeaders || [])];
                            while (newHeaders.length < numCols) newHeaders.push('');
                            const newData = (q.tableData || []).map(row => {
                              const newRow = [...row];
                              while (newRow.length <= numCols) newRow.push('');
                              return newRow.slice(0, numCols + 1);
                            });
                            updateQuestion(qIdx, 'numTableColumns', numCols);
                            updateQuestion(qIdx, 'tableHeaders', newHeaders.slice(0, numCols));
                            updateQuestion(qIdx, 'tableData', newData);
                          }}
                          className="w-16 rounded border border-input px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Column Headers</p>
                        <div className="flex gap-2 flex-wrap">
                          {Array.from({ length: q.numTableColumns || 2 }).map((_, hIdx) => (
                            <input
                              key={hIdx}
                              className="flex-1 min-w-20 rounded border border-input px-2 py-1.5 text-xs"
                              placeholder={`Header ${hIdx + 1}`}
                              value={q.tableHeaders?.[hIdx] || ''}
                              onChange={e => {
                                const newHeaders = [...(q.tableHeaders || [])];
                                newHeaders[hIdx] = e.target.value;
                                updateQuestion(qIdx, 'tableHeaders', newHeaders);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {q.tableData?.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-2 mb-2">
                            <input
                              className="w-20 rounded border border-input px-2 py-1.5 text-xs"
                              placeholder="(1) (2) (3)"
                              value={row[0] || ''}
                              onChange={e => {
                                const newData = [...q.tableData];
                                newData[rIdx][0] = e.target.value;
                                updateQuestion(qIdx, 'tableData', newData);
                              }}
                            />
                            {Array.from({ length: q.numTableColumns || 2 }).map((_, cIdx) => (
                              <input
                                key={cIdx}
                                className="flex-1 rounded border border-input px-2 py-1.5 text-xs"
                                placeholder={q.tableHeaders?.[cIdx] || `Column ${cIdx + 1}`}
                                value={row[cIdx + 1] || ''}
                                onChange={e => {
                                  const newData = [...q.tableData];
                                  newData[rIdx][cIdx + 1] = e.target.value;
                                  updateQuestion(qIdx, 'tableData', newData);
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {q.template === 'simple' && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Answer Options (A, B, C, D)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['A', 'B', 'C', 'D'].map(letter => (
                        <div key={letter} className="bg-background border-2 border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-center mb-2">
                            <span className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">{letter}</span>
                          </div>
                          <textarea
                            className="w-full rounded border border-input px-2 py-1.5 text-xs"
                            placeholder={`Option ${letter}`}
                            value={q.options_en[['A', 'B', 'C', 'D'].indexOf(letter)] || ''}
                            onChange={e => updateOption(qIdx, ['A', 'B', 'C', 'D'].indexOf(letter), 'en', e.target.value)}
                            rows="2"
                          />
                          <textarea
                            className="w-full rounded border border-input px-2 py-1.5 text-xs mt-1"
                            placeholder={`選項 ${letter}`}
                            value={q.options_zh[['A', 'B', 'C', 'D'].indexOf(letter)] || ''}
                            onChange={e => updateOption(qIdx, ['A', 'B', 'C', 'D'].indexOf(letter), 'zh', e.target.value)}
                            rows="2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.template === 'statements' && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Answer Options (A, B, C, D)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['A', 'B', 'C', 'D'].map(letter => (
                        <div key={letter} className="bg-background border-2 border-border rounded-lg p-2.5 hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-center mb-1.5">
                            <span className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center text-xs font-bold">{letter}</span>
                          </div>
                          <input
                            className="w-full rounded border border-input px-2 py-1.5 text-xs"
                            placeholder={`${letter}) e.g. (1)(2)`}
                            value={q.answers[letter]}
                            onChange={e => updateAnswer(qIdx, letter, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Explanation (English)" value={q.explanation_en} onChange={e => updateQuestion(qIdx, 'explanation_en', e.target.value)} />
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-3" placeholder="Explanation (中文)" value={q.explanation_zh} onChange={e => updateQuestion(qIdx, 'explanation_zh', e.target.value)} />

                <button onClick={() => removeQuestion(qIdx)} className="text-xs text-red-600 hover:text-red-700 px-2 py-1">Remove</button>
              </>
            )}
          </div>
        ))}

        {/* Data-based */}
        {type === 'data_based' && questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-muted/40 rounded-xl border border-border p-4">
            <button onClick={() => setExpanded(expanded === qIdx ? -1 : qIdx)} className="w-full flex items-center justify-between mb-3">
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Question {qIdx + 1}</p>
                <p className="text-xs text-muted-foreground">{q.sub_questions.length} sub-questions</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === qIdx ? 'rotate-180' : ''}`} />
            </button>

            {expanded === qIdx && (
              <>
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Context/Data description (English)" value={q.context_en} onChange={e => updateQuestion(qIdx, 'context_en', e.target.value)} />
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-3" placeholder="Context/Data description (中文)" value={q.context_zh} onChange={e => updateQuestion(qIdx, 'context_zh', e.target.value)} />

                <div className="mb-3">
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Reference Image (Optional)</label>
                  {q.image_url ? (
                    <div className="relative">
                      <img src={q.image_url} alt="Reference" className="w-full rounded-lg border border-border max-h-48 object-cover mb-2" />
                      <button type="button" onClick={() => updateQuestion(qIdx, 'image_url', '')} className="text-xs text-red-600 hover:text-red-700">Remove Image</button>
                    </div>
                  ) : (
                    <label 
                      className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive[qIdx] ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'}`}
                      onDragEnter={e => handleDrag(e, qIdx, true)}
                      onDragLeave={e => handleDrag(e, qIdx, false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, qIdx)}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        <span>Click or drag image here</span>
                      </div>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(qIdx, e.target.files?.[0])} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="mb-3 space-y-2">
                  {q.sub_questions.map((sq, subIdx) => (
                    <div key={subIdx} className="bg-background rounded-lg p-3 border border-border text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{sq.label})</span>
                        <input className="flex-1 rounded border border-input px-2 py-1 text-xs" placeholder="Marks" type="number" value={sq.marks} onChange={e => updateSubQuestion(qIdx, subIdx, 'marks', parseInt(e.target.value) || 0)} />
                        {q.sub_questions.length > 1 && <button onClick={() => removeSubQuestion(qIdx, subIdx)} className="text-xs text-red-600">Remove</button>}
                      </div>
                      <input className="w-full rounded border border-input px-2 py-1 text-xs" placeholder="Sub-question (English)" value={sq.question_en} onChange={e => updateSubQuestion(qIdx, subIdx, 'question_en', e.target.value)} />
                      <input className="w-full rounded border border-input px-2 py-1 text-xs" placeholder="Sub-question (中文)" value={sq.question_zh} onChange={e => updateSubQuestion(qIdx, subIdx, 'question_zh', e.target.value)} />
                      <textarea className="w-full rounded border border-input px-2 py-1 text-xs" placeholder="Answer (English)" value={sq.answer_en} onChange={e => updateSubQuestion(qIdx, subIdx, 'answer_en', e.target.value)} rows="2" />
                      <textarea className="w-full rounded border border-input px-2 py-1 text-xs" placeholder="Answer (中文)" value={sq.answer_zh} onChange={e => updateSubQuestion(qIdx, subIdx, 'answer_zh', e.target.value)} rows="2" />
                    </div>
                  ))}
                </div>

                <button onClick={() => addSubQuestion(qIdx)} className="text-xs text-primary hover:text-primary/80 mb-3 px-2 py-1">+ Add sub-question</button>

                <button onClick={() => removeQuestion(qIdx)} className="text-xs text-red-600 hover:text-red-700 px-2 py-1">Remove question</button>
              </>
            )}
          </div>
        ))}

        {/* Essay */}
        {type === 'short_essay' && questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-muted/40 rounded-xl border border-border p-4">
            <button onClick={() => setExpanded(expanded === qIdx ? -1 : qIdx)} className="w-full flex items-center justify-between mb-3">
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Question {qIdx + 1}</p>
                <p className="text-xs text-muted-foreground">{q.marks} marks</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === qIdx ? 'rotate-180' : ''}`} />
            </button>

            {expanded === qIdx && (
              <>
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Marks" type="number" value={q.marks} onChange={e => updateQuestion(qIdx, 'marks', parseInt(e.target.value) || 0)} />
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Question (English)" value={q.question_en} onChange={e => updateQuestion(qIdx, 'question_en', e.target.value)} rows="3" />
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Question (中文)" value={q.question_zh} onChange={e => updateQuestion(qIdx, 'question_zh', e.target.value)} rows="3" />

                <div className="mb-3">
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Reference Image (Optional)</label>
                  {q.image_url ? (
                    <div className="relative">
                      <img src={q.image_url} alt="Reference" className="w-full rounded-lg border border-border max-h-48 object-cover mb-2" />
                      <button type="button" onClick={() => updateQuestion(qIdx, 'image_url', '')} className="text-xs text-red-600 hover:text-red-700">Remove Image</button>
                    </div>
                  ) : (
                    <label 
                      className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive[qIdx] ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'}`}
                      onDragEnter={e => handleDrag(e, qIdx, true)}
                      onDragLeave={e => handleDrag(e, qIdx, false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, qIdx)}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        <span>Click or drag image here</span>
                      </div>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(qIdx, e.target.files?.[0])} className="hidden" />
                    </label>
                  )}
                </div>
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Guidance (English)" value={q.guidance_en} onChange={e => updateQuestion(qIdx, 'guidance_en', e.target.value)} rows="2" />
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Guidance (中文)" value={q.guidance_zh} onChange={e => updateQuestion(qIdx, 'guidance_zh', e.target.value)} rows="2" />
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Model answer (English)" value={q.model_answer_en} onChange={e => updateQuestion(qIdx, 'model_answer_en', e.target.value)} rows="3" />
                <textarea className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-3" placeholder="Model answer (中文)" value={q.model_answer_zh} onChange={e => updateQuestion(qIdx, 'model_answer_zh', e.target.value)} rows="3" />

                <button onClick={() => removeQuestion(qIdx)} className="text-xs text-red-600 hover:text-red-700 px-2 py-1">Remove</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <button onClick={handleSubmit} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90">
          ✅ Save Exercise ({questions.length} Q)
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-muted text-foreground rounded-lg font-semibold hover:bg-border border border-border">
          Cancel
        </button>
      </div>
    </div>
  );
}