import { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';
import { base44 } from '@/api/base44Client';

function useGrammarExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.GrammarExercise.list('-created_date', 200);
    // Normalize field names: ans_letter -> ansLetter
    setExercises(data.map(e => ({
      ...e,
      mcqData: (e.mcq_data || []).map(q => ({ ...q, ansLetter: q.ans_letter || q.ansLetter, opts: q.opts || [] }))
    })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { exercises, setExercises, loading, reload: load };
}

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
      if (parts.length < 6) { alert(`Error on line ${i + 1}: Not enough parts`); return; }
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
        <h3 className="text-sm font-bold text-primary mb-2 border-b border-border pb-1">MCQ Questions (Batch Input)</h3>
        <p className="text-xs text-muted-foreground mb-1">Format: <code className="bg-muted px-1 rounded">Question | A | B | C | D | Answer | Explanation</code></p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">Example: <code>She ___ yesterday. | goes | went | has gone | going | B | "Yesterday" = Past Simple.</code></p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-5" placeholder={"I ___ an apple every day. | eat | ate | eaten | eating | A | Habitual action = Present Simple."} value={form.batchData} onChange={e => s('batchData', e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors select-none">Save Exercise</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border select-none">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library ---
function GrammarLibrary({ exercises, isEditor, onView, onEdit, onDelete, onBulkImport, refreshing }) {
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
      <PullRefreshIndicator refreshing={refreshing} />
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Grammar Exercises</h1><p className="text-sm text-muted-foreground mt-1">Multiple choice grammar practice</p></div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border transition-colors select-none">📥 Import</button>}
          {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none">+ Add</button>}
        </div>
      </div>
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors select-none ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Exercises ({exercises.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors select-none ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({exercises.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors select-none ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st}</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground">No exercises found.</div>}
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md active:scale-[0.98] active:bg-muted transition-all card-item">
              <div>
                <h3 className="font-semibold text-foreground">{p.title} <span className="text-sm text-muted-foreground font-normal ml-2">({p.mcqData?.length || 0} Qs)</span></h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}</span>}
                  {p.subtopic && p.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">{p.subtopic}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors select-none">Practice</button>
                {isEditor && <>
                  <button onClick={() => onEdit(p)} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors border border-border select-none">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) onDelete(p.id); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 select-none">Delete</button>
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
    if (Object.keys(selected).length < total && !confirm("Haven't answered all. Submit anyway?")) return;
    setSubmitted(true);
  };

  const downloadWord = () => {
    const title = exercise.title;
    let html = exercise.mcqData.map((q, i) => {
      const optsHtml = q.opts.map((o, oi) => `<p style="margin:2px 0;">${letters[oi]}. ${o}</p>`).join('');
      return `<div style="margin-bottom:20px;"><p style="font-weight:bold;">${i + 1}. ${q.q}</p>${optsHtml}</div>`;
    }).join('');
    const content = `<html><head><meta charset='utf-8'><title>${title}</title></head><body style='font-family:serif;'><h1>${title}</h1>${html}</body></html>`;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = title.replace(/\s+/g, '_') + '.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  let score = 0;
  if (submitted) exercise.mcqData?.forEach((q, i) => { if (selected[i] === q.ansLetter) score++; });

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors select-none">← Back to Library</button>
        <div className="flex gap-2">
          <button onClick={downloadWord} className="text-xs bg-card border border-primary text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg font-medium transition-colors select-none">📥 Download Word</button>
          <button onClick={() => window.print()} className="text-xs bg-card border border-primary text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg font-medium transition-colors select-none">🖨️ Print</button>
        </div>
      </div>
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground mb-1">{exercise.title}</h2>
        <div className="flex flex-wrap gap-2">
          {exercise.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exercise.topic}</span>}
          {exercise.subtopic && exercise.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium">{exercise.subtopic}</span>}
        </div>
      </div>
      {submitted && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6 text-center">
          <p className="text-xl font-bold text-primary">🎉 Score: {score} / {exercise.mcqData?.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Review your answers and explanations below.</p>
        </div>
      )}
      <div className="space-y-5">
        {(exercise.mcqData || []).map((q, idx) => {
          const isCorrect = submitted && selected[idx] === q.ansLetter;
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
                    <label key={letter} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm select-none ${isCorr ? 'bg-green-50 border-green-400 text-green-900 font-semibold' : isInc ? 'bg-red-50 border-red-400 text-red-900' : isSel ? 'bg-sky-50 border-primary shadow-sm' : 'bg-background border-border hover:bg-accent'}`}>
                      <input type="radio" name={`q${idx}`} value={letter} checked={isSel} disabled={submitted} onChange={() => setSelected(s => ({ ...s, [idx]: letter }))} className="w-4 h-4 accent-primary cursor-pointer" />
                      <strong>{letter}.</strong> {opt}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <div className="mt-3 bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl text-sm text-amber-900">
                  <strong>Explanation:</strong> {selected[idx] === q.ansLetter ? 'Correct! ' : `The correct answer is ${q.ansLetter}. `}{q.exp}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        {!submitted
          ? <button onClick={handleSubmit} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors w-full max-w-sm select-none">📝 Submit All Answers</button>
          : <button onClick={() => { setSelected({}); setSubmitted(false); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors select-none">🔄 Try Again</button>
        }
      </div>
    </div>
  );
}

function BulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const arr = Array.isArray(data) ? data : [data];
        onImport(arr.map(p => ({ ...p, id: Date.now() + Math.random() })));
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Grammar Exercises</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file with an array of grammar exercise objects. Each needs <code className="bg-muted px-1 rounded">title</code> and <code className="bg-muted px-1 rounded">mcqData</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold hover:file:bg-primary/90 mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border select-none">Cancel</button>
      </div>
    </div>
  );
}

// --- Main ---
export default function GrammarModule({ isEditor }) {
  const navigate = useNavigate();
  const { exercises, loading, reload } = useGrammarExercises();

  const saveEx = async (data) => {
    const payload = { title: data.title, topic: data.topic, subtopic: data.subtopic, mcq_data: data.mcqData.map(q => ({ ...q, ans_letter: q.ansLetter })), is_published: true };
    if (data.id) await base44.entities.GrammarExercise.update(data.id, payload);
    else await base44.entities.GrammarExercise.create(payload);
    navigate('/grammar');
  };

  return (
    <Routes>
      <Route path="/grammar" element={
        loading
          ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : <GrammarLibrary exercises={exercises} isEditor={isEditor} refreshing={false}
              onView={p => navigate(`/grammar/practice/${p.id}`)}
              onEdit={p => navigate(p ? `/grammar/edit/${p.id}` : '/grammar/edit/new')}
              onDelete={async id => { await base44.entities.GrammarExercise.delete(id); reload(); }}
              onBulkImport={null}
            />
      } />
      <Route path="/grammar/practice/:id" element={(() => {
        const W = () => {
          const [ex, setEx] = useState(null);
          const id = window.location.pathname.split('/').pop();
          useEffect(() => {
            base44.entities.GrammarExercise.get(id).then(e => setEx({
              ...e,
              mcqData: (e.mcq_data || []).map(q => ({ ...q, ansLetter: q.ans_letter || q.ansLetter }))
            }));
          }, [id]);
          if (!ex) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <GrammarPracticeView exercise={ex} onBack={() => navigate('/grammar')} />;
        };
        return <W />;
      })()} />
      <Route path="/grammar/edit/:id" element={(() => {
        const W = () => {
          const [ex, setEx] = useState(undefined);
          const idStr = window.location.pathname.split('/').pop();
          useEffect(() => {
            if (idStr === 'new') { setEx(null); return; }
            base44.entities.GrammarExercise.get(idStr).then(e => setEx({
              ...e,
              mcqData: (e.mcq_data || []).map(q => ({ ...q, ansLetter: q.ans_letter || q.ansLetter }))
            }));
          }, [idStr]);
          if (ex === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <GrammarEditor exercise={ex} onSave={saveEx} onCancel={() => navigate('/grammar')} />;
        };
        return <W />;
      })()} />
    </Routes>
  );
}