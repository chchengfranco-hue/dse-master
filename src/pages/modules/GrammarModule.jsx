import { useState } from 'react';

const STORAGE_KEY = 'grammarExercises';

const defaultExercises = [
  {
    id: 1,
    title: 'Present Perfect vs Past Simple',
    topic: 'Tenses', subtopic: 'Perfect Tenses',
    mcqData: [
      { q: 'She ___ to the store yesterday.', opts: ['goes', 'went', 'has gone', 'going'], ansLetter: 'B', exp: '"Yesterday" indicates a completed past action → Past Simple.' },
      { q: 'I ___ this movie three times so far.', opts: ['watched', 'watch', 'have watched', 'am watching'], ansLetter: 'C', exp: '"So far" indicates an experience up to now → Present Perfect.' },
      { q: 'They ___ in Hong Kong since 2015.', opts: ['live', 'lived', 'have lived', 'are living'], ansLetter: 'C', exp: '"Since 2015" indicates an action from the past continuing to now → Present Perfect.' },
    ],
  },
  {
    id: 2,
    title: 'Passive Voice',
    topic: 'Grammar', subtopic: 'Passive Voice',
    mcqData: [
      { q: 'The letter ___ by the secretary this morning.', opts: ['typed', 'was typed', 'is typing', 'has typed'], ansLetter: 'B', exp: 'The subject receives the action → Passive Voice. "This morning" = past time.' },
      { q: 'The project ___ before the deadline.', opts: ['completes', 'is completing', 'must be completed', 'completing'], ansLetter: 'C', exp: 'Modal + passive: must + be + past participle.' },
    ],
  },
];

const load = () => { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultExercises; };
const persist = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

// --- Editor ---
function GrammarEditor({ exercise, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: exercise?.id || null,
    title: exercise?.title || '',
    topic: exercise?.topic || '',
    subtopic: exercise?.subtopic || '',
    batchData: exercise?.mcqData ? exercise.mcqData.map(q => `${q.q} | ${q.opts[0]} | ${q.opts[1]} | ${q.opts[2]} | ${q.opts[3]} | ${q.ansLetter} | ${q.exp}`).join('\n') : '',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim()) return alert('Title is required.');
    const lines = form.batchData.trim().split('\n').filter(l => l.trim());
    const mcqData = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split('|').map(p => p.trim());
      if (parts.length < 6) { alert(`Error on line ${i + 1}: Not enough parts (separated by |)`); return; }
      mcqData.push({ q: parts[0], opts: [parts[1], parts[2], parts[3], parts[4]], ansLetter: (parts[5] || 'A').toUpperCase(), exp: parts[6] || '' });
    }
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic.trim() || 'Uncategorized', subtopic: form.subtopic.trim() || 'General', mcqData });
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Exercise' : 'Add Grammar Exercise'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Main Topic (e.g. Tenses)" value={form.topic} onChange={e => s('topic', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Sub-topic (e.g. Present Perfect)" value={form.subtopic} onChange={e => s('subtopic', e.target.value)} />
        </div>
        <input className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-3" placeholder="Exercise Title" value={form.title} onChange={e => s('title', e.target.value)} />
        <h3 className="text-sm font-bold text-primary mb-2 border-b border-border pb-1">Multiple Choice Questions (Batch Input)</h3>
        <p className="text-xs text-muted-foreground mb-1">Format: <code className="bg-muted px-1 rounded">Question | Option A | Option B | Option C | Option D | Correct Letter | Explanation</code></p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">Example: <code>She ___ yesterday. | goes | went | has gone | going | B | "Yesterday" = Past Simple.</code></p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-5" placeholder={"I ___ an apple every day. | eat | ate | eaten | eating | A | Habitual action = Present Simple."} value={form.batchData} onChange={e => s('batchData', e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Save Exercise</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library ---
function GrammarLibrary({ exercises, isEditor, onView, onEdit, onDelete }) {
  const [sel, setSel] = useState('All'); const [selSub, setSelSub] = useState(null);
  const topicTree = {};
  exercises.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });
  const filtered = exercises.filter(p => sel === 'All' || (selSub ? p.topic === sel && p.subtopic === selSub : p.topic === sel));
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Grammar Exercises</h1><p className="text-sm text-muted-foreground mt-1">Multiple choice grammar practice</p></div>
        {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">+ Add Exercise</button>}
      </div>
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Exercises ({exercises.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({exercises.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st}</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground">No exercises found.</div>}
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-semibold text-foreground">{p.title} <span className="text-sm text-muted-foreground font-normal ml-2">({p.mcqData?.length || 0} Qs)</span></h3>
                {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium mt-2 inline-block">{p.topic}{p.subtopic && p.subtopic !== 'General' ? ` › ${p.subtopic}` : ''}</span>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Practice</button>
                {isEditor && <>
                  <button onClick={() => onEdit(p)} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors border border-border">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) onDelete(p.id); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">Delete</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Practice View ---
function GrammarPracticeView({ exercise, onBack }) {
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const letters = ['A', 'B', 'C', 'D'];

  const handleSubmit = () => {
    const total = exercise.mcqData?.length || 0;
    const answeredAll = Object.keys(selected).length === total;
    if (!answeredAll && !confirm("You haven't answered all questions. Submit anyway? Unanswered will be marked incorrect.")) return;
    setSubmitted(true);
  };

  const handleReset = () => { setSelected({}); setSubmitted(false); };

  const downloadWord = () => {
    const title = exercise.title;
    let html = exercise.mcqData.map((q, i) => {
      const optsHtml = q.opts.map((o, oi) => `<p style="margin:2px 0;">${letters[oi]}. ${o}</p>`).join('');
      return `<div style="margin-bottom:20px;"><p style="font-weight:bold;font-size:13pt;">${i + 1}. ${q.q}</p>${optsHtml}</div>`;
    }).join('');
    const content = `<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>${title}</title></head><body style='font-family:"Times New Roman";font-size:12pt;'><h1 style='color:#0284c7;'>${title}</h1><p>Name: ____________________ Date: ___________</p>${html}</body></html>`;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = title.replace(/\s+/g, '_') + '.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  let score = 0;
  if (submitted) { exercise.mcqData?.forEach((q, i) => { if (selected[i] === q.ansLetter) score++; }); }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">← Back to Library</button>
        <div className="flex gap-2">
          <button onClick={downloadWord} className="text-xs bg-card border border-primary text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg font-medium transition-colors">📥 Download Word (.doc)</button>
          <button onClick={() => window.print()} className="text-xs bg-card border border-primary text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg font-medium transition-colors">🖨️ Print Worksheet</button>
        </div>
      </div>

      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-1">{exercise.title}</h2>
        {exercise.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exercise.topic}{exercise.subtopic && exercise.subtopic !== 'General' ? ` › ${exercise.subtopic}` : ''}</span>}
      </div>

      {submitted && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6 text-center">
          <p className="text-xl font-bold text-primary">🎉 Score: {score} / {exercise.mcqData?.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Review your answers and explanations below.</p>
        </div>
      )}

      <div className="space-y-5">
        {(exercise.mcqData || []).map((q, idx) => {
          const isAnswered = selected[idx] !== undefined;
          const isCorrect = submitted && selected[idx] === q.ansLetter;
          const isWrong = submitted && isAnswered && selected[idx] !== q.ansLetter;
          return (
            <div key={idx} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="text-base font-bold text-primary mb-4">{idx + 1}. {q.q}</h3>
              <div className="space-y-2">
                {q.opts.map((opt, oi) => {
                  const letter = letters[oi];
                  const isSel = selected[idx] === letter;
                  const isCorr = submitted && letter === q.ansLetter;
                  const isInc = submitted && isSel && letter !== q.ansLetter;
                  return (
                    <label key={letter} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${isCorr ? 'bg-green-50 border-green-400 text-green-900 font-semibold' : isInc ? 'bg-red-50 border-red-400 text-red-900' : isSel ? 'bg-sky-50 border-primary shadow-sm' : 'bg-background border-border hover:bg-accent'}`}>
                      <input type="radio" name={`q${idx}`} value={letter} checked={isSel} disabled={submitted}
                        onChange={() => setSelected(s => ({ ...s, [idx]: letter }))}
                        className="w-4 h-4 accent-primary cursor-pointer" />
                      <strong>{letter}.</strong> {opt}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <div className="mt-3 bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl text-sm text-amber-900">
                  <strong>Explanation:</strong> {selected[idx] === q.ansLetter ? `Correct! ` : `The correct answer is ${q.ansLetter}. `}{q.exp}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        {!submitted ? (
          <button onClick={handleSubmit} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors w-full max-w-sm">📝 Submit All Answers</button>
        ) : (
          <button onClick={handleReset} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">🔄 Try Again</button>
        )}
      </div>
    </div>
  );
}

// --- Main Module ---
export default function GrammarModule({ isEditor }) {
  const [exercises, setExercises] = useState(load);
  const [view, setView] = useState('list');
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);

  const update = (data) => { setExercises(data); persist(data); };

  const saveEx = (data) => {
    if (data.id) update(exercises.map(e => e.id === data.id ? data : e));
    else update([...exercises, { ...data, id: Date.now() }]);
    setView('list');
  };

  if (view === 'edit') return <GrammarEditor exercise={editing} onSave={saveEx} onCancel={() => setView('list')} />;
  if (view === 'practice') return <GrammarPracticeView exercise={active} onBack={() => setView('list')} />;
  return (
    <GrammarLibrary
      exercises={exercises}
      isEditor={isEditor}
      onView={p => { setActive(p); setView('practice'); }}
      onEdit={p => { setEditing(p); setView('edit'); }}
      onDelete={id => update(exercises.filter(e => e.id !== id))}
    />
  );
}