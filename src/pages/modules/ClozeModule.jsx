import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'clozeExercises';

const defaultExercises = [
  {
    id: 1,
    title: 'Social Media and Youth',
    topic: 'Technology', subtopic: 'Social Media',
    hasOptions: 'bank',
    content: `Social media has [fundamentally|adv. completely and basically] [transformed|v. changed completely] the way young people [communicate|v. exchange information]. Platforms such as Instagram and TikTok have created [unprecedented|adj. never seen before] opportunities for [self-expression|n. sharing your feelings and ideas].

However, researchers have raised concerns about the [detrimental|adj. causing harm] effects of excessive social media use. Studies [indicate|v. show] that prolonged exposure to curated online content can [exacerbate|v. make worse] feelings of inadequacy among teenagers.`,
    annotations: {
      fundamentally: 'adv. completely and basically',
      transformed: 'v. changed completely',
      unprecedented: 'adj. never seen before',
      detrimental: 'adj. causing harm',
      exacerbate: 'v. make worse',
    },
  },
];

const load = () => {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : defaultExercises;
};
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

// --- Parse cloze content into tokens ---
function parseClozeTokens(raw) {
  const regex = /\[([^\]\|]+)(?:\|([^\]]+))?\]/g;
  const parts = [];
  let last = 0;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: raw.slice(last, match.index) });
    const rawWord = match[1];
    const explanation = match[2] || '';
    const wordParts = rawWord.split('/');
    const correct = wordParts[0].trim();
    const distractors = wordParts.slice(1).map(s => s.trim());
    parts.push({ type: 'blank', correct, distractors, explanation });
    last = match.index + match[0].length;
  }
  if (last < raw.length) parts.push({ type: 'text', value: raw.slice(last) });
  return parts;
}

// --- Build word bank from all blanks ---
function buildWordBank(tokens) {
  return [...new Set(tokens.filter(t => t.type === 'blank').map(t => t.correct))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

// --- AnnotatedText: renders text with ruby/tooltip for annotated words ---
function AnnotatedText({ text, annotations, showRuby, activeWord, onWordClick }) {
  if (!annotations || !Object.keys(annotations).length) return <span className="whitespace-pre-wrap">{text}</span>;
  const words = Object.keys(annotations);
  const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = [];
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
    const canonical = words.find(w => w.toLowerCase() === m[1].toLowerCase()) || m[1];
    parts.push({ type: 'word', value: m[1], canonical });
    last = m.index + m[1].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.value}</span>;
        const meaning = annotations[p.canonical];
        const isActive = activeWord === p.canonical;
        if (showRuby) return (
          <ruby key={i} onClick={() => onWordClick(p.canonical)} className="cursor-pointer font-semibold" style={{ rubyAlign: 'center' }}>
            {p.value}<rt style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', lineHeight: 1 }}>{meaning}</rt>
          </ruby>
        );
        return (
          <span key={i} onClick={() => onWordClick(p.canonical)}
            className={`cursor-pointer rounded px-0.5 border-b border-dashed transition-all ${isActive ? 'bg-yellow-200 text-yellow-900 border-transparent font-semibold' : 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-yellow-100'}`}>
            {p.value}
          </span>
        );
      })}
    </span>
  );
}

// --- ClozeContent component ---
function ClozeContent({ tokens, hasOptions, answers, setAnswers, submitted, annotations, showRuby, activeWord, onWordClick }) {
  const bank = buildWordBank(tokens);
  let blankIndex = 0;
  return (
    <span>
      {tokens.map((token, i) => {
        if (token.type === 'text') {
          return (
            <AnnotatedText key={i} text={token.value} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={onWordClick} />
          );
        }
        const idx = blankIndex++;
        const correct = token.correct;
        const userAns = answers[idx] || '';
        const isCorrect = submitted ? userAns.trim().toLowerCase() === correct.toLowerCase() : null;
        const expEl = submitted ? (
          <span className={`text-xs ml-1 px-1.5 py-0.5 rounded font-medium ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isCorrect ? `✅${token.explanation ? ' ' + token.explanation : ''}` : `✅ ${correct}${token.explanation ? ' — ' + token.explanation : ''}`}
          </span>
        ) : null;

        if (hasOptions === 'mcq') {
          let options = token.distractors.length > 0
            ? [...new Set([correct, ...token.distractors])]
            : [...bank];
          if (!submitted) options = [...options].sort(() => 0.5 - Math.random());
          else options = [...new Set([correct, ...token.distractors])].sort((a, b) => a.localeCompare(b));
          return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1">
              <select
                disabled={submitted}
                value={userAns}
                onChange={e => setAnswers(a => { const n = [...a]; n[idx] = e.target.value; return n; })}
                className={`border-b-2 text-center px-1 py-0 bg-transparent text-base outline-none transition-colors ${submitted ? (isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700') : 'border-primary text-primary'}`}
              >
                <option value=""></option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {expEl}
            </span>
          );
        }
        // text input
        const w = Math.max(90, correct.length * 12 + 10);
        return (
          <span key={i} className="inline-flex flex-col items-center align-middle mx-1">
            <input
              type="text"
              disabled={submitted}
              value={userAns}
              onChange={e => setAnswers(a => { const n = [...a]; n[idx] = e.target.value; return n; })}
              style={{ width: w }}
              className={`border-b-2 bg-transparent text-center outline-none text-base py-0 transition-colors ${submitted ? (isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700') : 'border-primary text-primary'}`}
            />
            {expEl}
          </span>
        );
      })}
    </span>
  );
}

// --- Editor ---
function ClozeEditor({ exercise, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: exercise?.id || null,
    title: exercise?.title || '',
    topic: exercise?.topic || '',
    subtopic: exercise?.subtopic || '',
    hasOptions: exercise?.hasOptions || 'bank',
    content: exercise?.content || '',
    annotationsText: exercise?.annotations ? Object.entries(exercise.annotations).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return alert('Title and Content are required.');
    const annotations = {};
    form.annotationsText.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const w = line.slice(0, idx).trim(), m = line.slice(idx + 1).trim();
        if (w && m) annotations[w] = m;
      }
    });
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic.trim() || 'Uncategorized', subtopic: form.subtopic.trim() || 'General', hasOptions: form.hasOptions, content: form.content.trim(), annotations });
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Exercise' : 'Add Cloze Exercise'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Main Topic" value={form.topic} onChange={e => set('topic', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Sub-topic" value={form.subtopic} onChange={e => set('subtopic', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Exercise Title" value={form.title} onChange={e => set('title', e.target.value)} />
          <select className="rounded-xl border border-input px-3 py-2 text-sm" value={form.hasOptions} onChange={e => set('hasOptions', e.target.value)}>
            <option value="bank">Text Input (With Word Bank)</option>
            <option value="nobank">Text Input (Without Word Bank)</option>
            <option value="mcq">Multiple Choice Dropdown</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Enclose target words in brackets. To add an explanation, use a pipe <code className="bg-muted px-1 rounded">|</code>.<br />For MCQ dropdowns, add wrong answers: <code className="bg-muted px-1 rounded">[fox/dog/cat|A wild animal]</code></p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-3 font-inherit" placeholder="Paste exercise content here..." value={form.content} onChange={e => set('content', e.target.value)} />
        <p className="text-xs text-muted-foreground mb-2"><strong>Batch Annotations (Optional):</strong> <code className="bg-muted px-1 rounded">word: meaning</code> one per line.</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y mb-5 font-inherit" placeholder={"word: definition\nword: definition"} value={form.annotationsText} onChange={e => set('annotationsText', e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library list ---
function ClozeLibrary({ exercises, isEditor, onView, onEdit, onDelete }) {
  const [selected, setSelected] = useState('All');
  const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER = 10;
  const topicTree = {};
  exercises.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });
  const filtered = exercises.filter(p => {
    const tm = selected === 'All' || (selSub ? p.topic === selected && p.subtopic === selSub : p.topic === selected);
    const sm = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return tm && sm;
  });
  const totalPages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice((page - 1) * PER, page * PER);
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Cloze Exercises</h1><p className="text-sm text-muted-foreground mt-1">Fill-in-the-blank vocabulary exercises</p></div>
        {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">+ Add Exercise</button>}
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search exercises..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSelected('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${selected === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Exercises ({exercises.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSelected(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${selected === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({exercises.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSelected(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors ${selected === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st} ({exercises.filter(p => p.topic === t && p.subtopic === st).length})</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No exercises found.</div>}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}{p.subtopic && p.subtopic !== 'General' ? ` › ${p.subtopic}` : ''}</span>}
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{p.hasOptions === 'bank' ? 'Word Bank' : p.hasOptions === 'mcq' ? 'MCQ Dropdown' : 'Text Input'}</span>
                </div>
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
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-border">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Read/Practice View ---
function ClozeReadView({ exercise, isEditor, onBack, onSaveAnnotation }) {
  const tokens = parseClozeTokens(exercise.content || '');
  const blankCount = tokens.filter(t => t.type === 'blank').length;
  const [answers, setAnswers] = useState(Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [showRuby, setShowRuby] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const annotations = exercise.annotations || {};
  const wordBank = buildWordBank(tokens);

  const speak = (text) => { window.speechSynthesis?.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; window.speechSynthesis?.speak(u); };

  const handleSubmit = () => {
    if (!submitted) {
      const allAnswered = answers.every(a => a.trim());
      if (!allAnswered && !confirm("You haven't answered all questions. Submit anyway?")) return;
    }
    setSubmitted(true);
  };

  const handleReset = () => { setAnswers(Array(blankCount).fill('')); setSubmitted(false); };

  const handleWordClick = (word) => {
    speak(word);
    if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word);
  };

  const handleTextSelect = useCallback(() => {
    if (!isEditor) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0 && sel.length < 35 && !sel.includes('\n')) {
      setTimeout(() => {
        const meaning = prompt(`Add annotation for "${sel}":\n(Leave blank and press OK to remove)`);
        if (meaning !== null) { onSaveAnnotation(exercise.id, sel, meaning.trim()); window.getSelection()?.removeAllRanges(); }
      }, 50);
    }
  }, [isEditor, exercise.id, onSaveAnnotation]);

  const posClass = (m) => { const t = (m || '').toLowerCase(); if (/^n\./.test(t)) return 'border-l-4 border-blue-400 bg-blue-50'; if (/^v\./.test(t)) return 'border-l-4 border-red-400 bg-red-50'; if (/^adj\./.test(t)) return 'border-l-4 border-emerald-400 bg-emerald-50'; if (/^adv\./.test(t)) return 'border-l-4 border-amber-400 bg-amber-50'; return 'border-l-4 border-border bg-muted/40'; };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">← Back to Library</button>
        <div className="flex flex-wrap gap-2">
          {Object.keys(annotations).length > 0 && <>
            <button onClick={() => setShowRuby(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>📖 {showRuby ? 'Hide' : 'Show'} Ruby</button>
            <button onClick={() => setShowMargin(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}
          <button onClick={() => setShowPrint(true)} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors">🖨️ Print…</button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{exercise.title}</h2>
        {exercise.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exercise.topic}{exercise.subtopic && exercise.subtopic !== 'General' ? ` › ${exercise.subtopic}` : ''}</span>}
      </div>

      {isEditor && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm"><strong>Editor Mode:</strong> Highlight any word (not bracketed blanks) to add/remove an annotation.</div>}

      {exercise.hasOptions === 'bank' && wordBank.length > 0 && !submitted && (
        <div className="bg-sky-50 border border-dashed border-sky-300 rounded-xl p-4 mb-5 text-center">
          <strong className="text-sky-700 text-sm block mb-2">Word Bank:</strong>
          <div className="flex flex-wrap gap-2 justify-center">
            {wordBank.map(w => <span key={w} className="bg-white border border-sky-200 text-foreground px-3 py-1 rounded-full text-sm shadow-sm">{w}</span>)}
          </div>
        </div>
      )}

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 lg:p-8 text-lg leading-loose" onMouseUp={handleTextSelect}>
          <ClozeContent tokens={tokens} hasOptions={exercise.hasOptions} answers={answers} setAnswers={setAnswers} submitted={submitted} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />
        </div>
        {showMargin && Object.keys(annotations).length > 0 && (
          <aside className="w-40 shrink-0 flex flex-col gap-2.5 pt-1">
            {Object.entries(annotations).map(([word, meaning]) => (
              <div key={word} onMouseEnter={() => setActiveWord(word)} onMouseLeave={() => setActiveWord(null)}
                className={`rounded-lg px-3 py-2 text-[11px] leading-snug cursor-pointer transition-all duration-150 ${posClass(meaning)} ${activeWord === word ? 'shadow-md -translate-x-0.5' : ''}`}>
                <strong className="block text-[12px] text-primary mb-0.5">{word}</strong>{meaning}
              </div>
            ))}
          </aside>
        )}
      </div>

      {!submitted ? (
        <div className="mt-5 text-center">
          <button onClick={handleSubmit} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">✅ Submit Answers</button>
        </div>
      ) : (
        <div className="mt-5 text-center space-x-3">
          <button onClick={handleReset} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm">🔄 Try Again</button>
        </div>
      )}

      {activeWord && !showMargin && !showRuby && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl z-50 max-w-xs text-center pointer-events-none">
          <strong className="block text-primary">{activeWord}</strong>{annotations[activeWord]}
        </div>
      )}

      {showPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">🖨️ Print Options</h3>
            <button onClick={() => { window.print(); setShowPrint(false); }} className="w-full text-left mb-2 px-4 py-3 rounded-xl bg-secondary border border-border font-semibold text-sm hover:bg-muted transition-colors">1. Print Exercise (Blanks Only)</button>
            <button onClick={() => { const t = exercise.title + '\n\n' + Object.entries(annotations).sort().map(([w, m]) => `${w}: ${m}`).join('\n'); navigator.clipboard?.writeText(t).then(() => alert('Copied!')); setShowPrint(false); }} className="w-full text-left mb-3 px-4 py-3 rounded-xl bg-secondary border border-border font-semibold text-sm hover:bg-muted transition-colors">📋 Copy Text + Vocab to Clipboard</button>
            <button onClick={() => setShowPrint(false)} className="w-full px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Module ---
export default function ClozeModule({ isEditor }) {
  const [exercises, setExercises] = useState(load);
  const [view, setView] = useState('list');
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);

  const update = (data) => { setExercises(data); save(data); };

  const saveExercise = (data) => {
    if (data.id) update(exercises.map(e => e.id === data.id ? data : e));
    else update([...exercises, { ...data, id: Date.now() }]);
    setView('list');
  };

  const handleSaveAnnotation = (exId, word, meaning) => {
    const updated = exercises.map(e => {
      if (e.id !== exId) return e;
      const annotations = { ...(e.annotations || {}) };
      if (!meaning) delete annotations[word]; else annotations[word] = meaning;
      return { ...e, annotations };
    });
    update(updated);
    setActive(updated.find(e => e.id === exId));
  };

  if (view === 'edit') return <ClozeEditor exercise={editing} onSave={saveExercise} onCancel={() => setView('list')} />;
  if (view === 'read') return <ClozeReadView exercise={active} isEditor={isEditor} onBack={() => setView('list')} onSaveAnnotation={handleSaveAnnotation} />;
  return (
    <ClozeLibrary
      exercises={exercises}
      isEditor={isEditor}
      onView={p => { setActive(p); setView('read'); }}
      onEdit={p => { setEditing(p); setView('edit'); }}
      onDelete={id => update(exercises.filter(e => e.id !== id))}
    />
  );
}