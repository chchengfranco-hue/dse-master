import { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';

export default function GeoManualForm({ type, topic, onSubmit, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [expanded, setExpanded] = useState(0);

  const addQuestion = () => {
    if (type === 'mcq') {
      setQuestions([...questions, { question_en: '', question_zh: '', options_en: ['', '', '', ''], options_zh: ['', '', '', ''], correct: 'A', explanation_en: '', explanation_zh: '' }]);
    } else if (type === 'data_based') {
      setQuestions([...questions, { context_en: '', context_zh: '', sub_questions: [{ label: 'a', question_en: '', question_zh: '', marks: 0, answer_en: '', answer_zh: '' }] }]);
    } else {
      setQuestions([...questions, { question_en: '', question_zh: '', marks: 0, guidance_en: '', guidance_zh: '', model_answer_en: '', model_answer_zh: '' }]);
    }
    setExpanded(questions.length);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, lang, value) => {
    const updated = [...questions];
    const arr = lang === 'en' ? updated[qIdx].options_en : updated[qIdx].options_zh;
    arr[oIdx] = value;
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
                <p className="text-xs text-muted-foreground">{q.question_en.slice(0, 50)}...</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === qIdx ? 'rotate-180' : ''}`} />
            </button>

            {expanded === qIdx && (
              <>
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-2" placeholder="Question (English)" value={q.question_en} onChange={e => updateQuestion(qIdx, 'question_en', e.target.value)} />
                <input className="w-full rounded-lg border border-input px-3 py-2 text-sm mb-3" placeholder="Question (中文)" value={q.question_zh} onChange={e => updateQuestion(qIdx, 'question_zh', e.target.value)} />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {['A', 'B', 'C', 'D'].map((letter, oIdx) => (
                    <div key={oIdx} className="bg-background rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{letter}</span>
                      </div>
                      <input className="w-full rounded border border-input px-2 py-1.5 text-xs" placeholder={`Option (EN)`} value={q.options_en[oIdx]} onChange={e => updateOption(qIdx, oIdx, 'en', e.target.value)} />
                      <input className="w-full rounded border border-input px-2 py-1.5 text-xs" placeholder={`選項 (中文)`} value={q.options_zh[oIdx]} onChange={e => updateOption(qIdx, oIdx, 'zh', e.target.value)} />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <select value={q.correct} onChange={e => updateQuestion(qIdx, 'correct', e.target.value)} className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background">
                    {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground leading-9">Correct answer</span>
                </div>

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