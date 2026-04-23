import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { contentApi } from '@/lib/contentApi';

function useSpeakingExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SpeakingExam.list('-created_date', 200);
    setExams(data.map(e => ({
      ...e,
      annotations: e.annotations || {},
      partA: e.part_a ? { ...e.part_a, focusIdeas: e.part_a.focus_ideas || e.part_a.focusIdeas || [] } : {},
      partB: e.part_b || [],
    })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { exams, loading, reload: load };
}

const defaultExams = [

  {
    id: 1,
    title: '2023 Mock Paper 4 — Climate Change',
    topic: 'Environment', subtopic: 'Climate',
    customCode: 'SP-001',
    partA: {
      intro: 'You are doing a school project on climate change and its impact on Hong Kong.',
      passageTitle: 'Rising Temperatures in Hong Kong',
      passage: 'According to the Hong Kong Observatory, the average temperature in Hong Kong has risen by approximately 1.2°C over the past century. This trend is projected to accelerate, with extreme heat events becoming more frequent and severe. Low-lying coastal areas face increasing risk of flooding due to rising sea levels, threatening communities and infrastructure alike.',
      situation: 'Your group is discussing ways to reduce the impact of climate change in Hong Kong. Consider the following points.',
      focus: ['Government Policy', 'Individual Action', 'Education & Awareness'],
      focusIdeas: [
        'Carbon tax, renewable energy subsidies, stricter building codes',
        'Reducing meat consumption, using public transport, cutting single-use plastics',
        'School curriculum changes, public campaigns, community workshops',
      ],
    },
    partB: [
      { q: 'Do you think the government is doing enough to combat climate change?', g: 'State your stance clearly. Give 2 concrete policy examples. Consider international agreements.' },
      { q: 'How can young people contribute to environmental sustainability?', g: 'Think about school initiatives, social media advocacy, and everyday lifestyle changes.' },
      { q: 'Is economic development always in conflict with environmental protection? Discuss.', g: 'Consider both sides. Give examples of countries that have balanced both.' },
    ],
    annotations: {
      accelerate: 'v. to increase in speed',
      projected: 'v. estimated or predicted',
      infrastructure: 'n. basic physical systems of a society',
    },
  },
];

function speak(text) { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.95; window.speechSynthesis.speak(u); }

function getPoSClass(m) { const t = (m || '').trim().toLowerCase(); if (/^n\./.test(t)) return 'pos-noun'; if (/^v\./.test(t)) return 'pos-verb'; if (/^adj\./.test(t)) return 'pos-adj'; if (/^adv\./.test(t)) return 'pos-adv'; return 'pos-other'; }
function posColorBorder(m) { const c = getPoSClass(m); if (c === 'pos-noun') return 'border-l-4 border-blue-400 bg-blue-50'; if (c === 'pos-verb') return 'border-l-4 border-red-400 bg-red-50'; if (c === 'pos-adj') return 'border-l-4 border-emerald-400 bg-emerald-50'; if (c === 'pos-adv') return 'border-l-4 border-amber-400 bg-amber-50'; return 'border-l-4 border-border bg-muted/40'; }

// --- Annotated text ---
function AnnotatedContent({ text, annotations, showRuby, activeWord, onWordClick }) {
  if (!annotations || !Object.keys(annotations).length || !text) return <span className="whitespace-pre-wrap">{text}</span>;
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

// --- Editor ---
function SpeakingEditor({ exam, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: exam?.id || null,
    title: exam?.title || '',
    topic: exam?.topic || '',
    subtopic: exam?.subtopic || '',
    customCode: exam?.customCode || '',
    intro: exam?.partA?.intro || '',
    passageTitle: exam?.partA?.passageTitle || '',
    passage: exam?.partA?.passage || '',
    situation: exam?.partA?.situation || '',
    batchFocus: exam?.partA ? (exam.partA.focus || []).map((f, i) => f + (exam.partA.focusIdeas?.[i] ? ' | ' + exam.partA.focusIdeas[i] : '')).join('\n') : '',
    batchQuestions: exam?.partB ? exam.partB.map(q => q.q + (q.g ? ' | ' + q.g : '')).join('\n') : '',
    annotationsText: exam?.annotations ? Object.entries(exam.annotations).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim()) return alert('Title is required.');
    const focusLines = form.batchFocus.trim().split('\n').filter(l => l.trim());
    const fArr = [], gfArr = [];
    focusLines.forEach(line => { const parts = line.split('|'); fArr.push(parts[0].trim()); gfArr.push(parts[1] ? parts[1].trim() : ''); });
    const qLines = form.batchQuestions.trim().split('\n').filter(l => l.trim());
    const partB = qLines.map(line => { const parts = line.split('|'); return { q: parts[0].trim(), g: parts[1] ? parts[1].trim() : '' }; });
    const annotations = {};
    form.annotationsText.split('\n').forEach(line => { const idx = line.indexOf(':'); if (idx > 0) { const w = line.slice(0, idx).trim(), m = line.slice(idx + 1).trim(); if (w && m) annotations[w] = m; } });
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic.trim() || 'Uncategorized', subtopic: form.subtopic.trim() || 'General', customCode: form.customCode.trim(), partA: { intro: form.intro.trim(), passageTitle: form.passageTitle.trim(), passage: form.passage.trim(), situation: form.situation.trim(), focus: fArr, focusIdeas: gfArr }, partB, annotations });
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Practice' : 'Add Speaking Exam Practice'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Main Topic" value={form.topic} onChange={e => s('topic', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Sub-topic" value={form.subtopic} onChange={e => s('subtopic', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Exam Title (e.g. 2021 Paper 4)" value={form.title} onChange={e => s('title', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Custom Code (e.g. SP-001)" value={form.customCode} onChange={e => s('customCode', e.target.value)} />
        </div>
        <h3 className="text-sm font-bold text-primary mb-2 mt-4 border-b border-border pb-1">Part A: Group Discussion</h3>
        <input className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-3" placeholder="Topic Introduction (e.g. You are doing a project on...)" value={form.intro} onChange={e => s('intro', e.target.value)} />
        <input className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-3" placeholder="Passage Title (Optional)" value={form.passageTitle} onChange={e => s('passageTitle', e.target.value)} />
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-28 resize-y mb-3" placeholder="Paste the reading passage here..." value={form.passage} onChange={e => s('passage', e.target.value)} />
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-16 resize-y mb-3" placeholder="Situation (e.g. Your group is discussing...)" value={form.situation} onChange={e => s('situation', e.target.value)} />
        <p className="text-xs font-semibold mb-1 text-foreground">Discussion Focus & Brainstorming Ideas:</p>
        <p className="text-xs text-muted-foreground mb-2">Format: <code className="bg-muted px-1 rounded">Focus Point | Brainstorming Hint</code> (one per line)</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y mb-4" placeholder={"Benefits of the proposal | saves time, cost-effective\nPotential problems | budget limits, lack of staff"} value={form.batchFocus} onChange={e => s('batchFocus', e.target.value)} />
        <h3 className="text-sm font-bold text-primary mb-2 border-b border-border pb-1">Part B: Individual Response</h3>
        <p className="text-xs text-muted-foreground mb-2">Format: <code className="bg-muted px-1 rounded">Question | Brainstorming Guideline</code> (one per line)</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-28 resize-y mb-4" placeholder={"Do you agree? | State your stance and give 2 reasons.\nWhat are the impacts? | Think short-term and long-term."} value={form.batchQuestions} onChange={e => s('batchQuestions', e.target.value)} />
        <h3 className="text-sm font-bold text-primary mb-2 border-b border-border pb-1">Annotations & Vocabulary</h3>
        <p className="text-xs text-muted-foreground mb-2">Format: <code className="bg-muted px-1 rounded">word: meaning</code> (one per line)</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-20 resize-y mb-5" placeholder={"word: definition\nword: definition"} value={form.annotationsText} onChange={e => s('annotationsText', e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Save Practice</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library ---
function SpeakingLibrary({ exams, isEditor, onView, onEdit, onDelete, onBulkImport }) {
  const [sel, setSel] = useState('All'); const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const PER = 10;
  const topicTree = {};
  exams.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });
  const filtered = exams.filter(p => {
    const tm = sel === 'All' || (selSub ? p.topic === sel && p.subtopic === selSub : p.topic === sel);
    const sm = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return tm && sm;
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(filtered.length / PER);
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Speaking Exam Library</h1><p className="text-sm text-muted-foreground mt-1">HKDSE Paper 4 speaking practice materials</p></div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border select-none">📥 Import</button>}
          {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none">+ Add Exam Practice</button>}
        </div>
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search exams..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Exams ({exams.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({exams.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st} ({exams.filter(p => p.topic === t && p.subtopic === st).length})</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No exams found.</div>}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md active:scale-[0.98] active:bg-muted transition-all card-item">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  {isEditor && p.customCode && <span className="font-mono text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">🏷️ {p.customCode}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}</span>}
                  {p.subtopic && p.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">{p.subtopic}</span>}
                  {p.partB?.length > 0 && <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{p.partB.length} Part B Qs</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Read</button>
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

// --- Read View ---
function SpeakingReadView({ exam, isEditor, onBack, onSaveAnnotation }) {
  const [showRuby, setShowRuby] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const annotations = exam.annotations || {};

  const handleWordClick = (word) => { speak(word); if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word); };

  const handlePrint = (withHints) => {
    const style = document.createElement('style');
    style.id = '__print_style__';
    style.innerHTML = `
      @media print {
        .brainstorm-hint { display: ${withHints ? 'block' : 'none'} !important; }
        nav, header, button, .no-print { display: none !important; }
        [data-vaul-drawer-direction] > div:first-child,
        [data-radix-scroll-area-scrollbar] { display: none !important; }
        ${!withHints ? `
        * { page-break-inside: avoid !important; page-break-after: avoid !important; page-break-before: avoid !important; }
        html, body { height: auto !important; overflow: visible !important; }
        @page { margin: 0.5cm; size: A4 portrait; }
        ` : ''}
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const playFull = () => {
    let text = '';
    const p = exam.partA;
    if (p?.intro) text += p.intro + '. ';
    if (p?.passage) text += p.passage + '. ';
    if (p?.situation) text += p.situation + '. ';
    if (p?.focus?.length) text += 'Discussion focus: ' + p.focus.join(', ') + '. ';
    if (exam.partB?.length) text += 'Part B. ' + exam.partB.map(q => q.q).join('. ');
    speak(text);
  };

  const handleTextSelect = useCallback(() => {
    if (!isEditor) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0 && sel.length < 35 && !sel.includes('\n')) {
      setTimeout(() => {
        const meaning = prompt(`Add annotation for "${sel}":\n(Leave blank to remove)`);
        if (meaning !== null) { onSaveAnnotation(exam.id, sel, meaning.trim()); window.getSelection()?.removeAllRanges(); }
      }, 50);
    }
  }, [isEditor, exam.id, onSaveAnnotation]);

  const pA = exam.partA || {};
  const annotationCount = Object.keys(annotations).length;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">← Back to Library</button>
        <div className="flex flex-wrap gap-2">
          <button onClick={playFull} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Paper</button>
          <button onClick={() => { const s = window.getSelection()?.toString().trim(); if (s) speak(s); else alert('Please highlight text first.'); }} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Selection</button>
          <button onClick={() => window.speechSynthesis?.cancel()} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">⏹ Stop</button>
          {annotationCount > 0 && <>
            <button onClick={() => setShowRuby(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>📖 {showRuby ? 'Hide' : 'Show'} Annotations</button>
            <button onClick={() => setShowMargin(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}
          <button onClick={() => handlePrint(true)} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors select-none">🖨️ Print</button>
          <button onClick={() => handlePrint(false)} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors select-none">🖨️ Print (No Hints)</button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{exam.title}</h2>
        {exam.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exam.topic}{exam.subtopic && exam.subtopic !== 'General' ? ` › ${exam.subtopic}` : ''}</span>}
      </div>

      {isEditor && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm"><strong>Editor Mode:</strong> Highlight any word to add/remove annotations.</div>}

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 text-base leading-relaxed space-y-5" onMouseUp={handleTextSelect}>
          {/* Part A */}
          <div>
            <h3 className="text-lg font-bold text-primary border-b-2 border-sky-200 pb-2 mb-4">Part A: Group Discussion</h3>
            {pA.intro && <p className="italic text-muted-foreground mb-3"><AnnotatedContent text={pA.intro} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} /></p>}
            {(pA.passageTitle || pA.passage) && (
              <div className="border-l-4 border-primary bg-sky-50 rounded-r-xl p-4 mb-4 whitespace-pre-wrap">
                {pA.passageTitle && <strong className="block text-foreground mb-2">{pA.passageTitle}</strong>}
                {pA.passage && <AnnotatedContent text={pA.passage} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />}
              </div>
            )}
            {pA.situation && <p className="mb-4"><strong>Your Task:</strong><br /><AnnotatedContent text={pA.situation} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} /></p>}
            {pA.focus?.some(f => f) && (
              <div>
                <p className="font-semibold mb-2">You may want to talk about:</p>
                <ul className="space-y-3 pl-4">
                  {pA.focus.map((f, i) => f ? (
                    <li key={i} className="list-disc">
                      <AnnotatedContent text={f} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />
                      {pA.focusIdeas?.[i] && (
                        <div className="brainstorm-hint mt-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
                          💡 <strong>Brainstorming Ideas:</strong><br />{pA.focusIdeas[i]}
                        </div>
                      )}
                    </li>
                  ) : null)}
                </ul>
              </div>
            )}
          </div>
          {/* Part B */}
          {exam.partB?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-primary border-b-2 border-sky-200 pb-2 mb-4">Part B: Individual Response</h3>
              <ol className="space-y-4 pl-4">
                {exam.partB.map((item, i) => (
                  <li key={i} className="list-decimal">
                    <AnnotatedContent text={item.q} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />
                    {item.g && (
                      <div className="brainstorm-hint mt-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
                        💡 <strong>Brainstorming Guidelines:</strong><br />{item.g}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {showMargin && annotationCount > 0 && (
          <aside className="w-40 shrink-0 flex flex-col gap-2.5 pt-1">
            {Object.entries(annotations).map(([word, meaning]) => (
              <div key={word} onMouseEnter={() => setActiveWord(word)} onMouseLeave={() => setActiveWord(null)}
                className={`rounded-lg px-3 py-2 text-[11px] leading-snug cursor-pointer transition-all duration-150 ${posColorBorder(meaning)} ${activeWord === word ? 'shadow-md -translate-x-0.5' : ''}`}>
                <strong className="block text-[12px] text-primary mb-0.5">{word}</strong>{meaning}
              </div>
            ))}
          </aside>
        )}
      </div>

      {activeWord && !showMargin && !showRuby && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl z-50 max-w-xs text-center pointer-events-none">
          <strong className="block text-primary">{activeWord}</strong>{annotations[activeWord]}
        </div>
      )}


    </div>
  );
}

function SpeakingBulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); onImport(Array.isArray(data) ? data : [data]); } catch { alert('Invalid JSON file.'); } };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Speaking Exams</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file with an array of speaking exam objects. Each needs at least <code className="bg-muted px-1 rounded">title</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border select-none">Cancel</button>
      </div>
    </div>
  );
}

// --- Main Module ---
export default function SpeakingModule({ isEditor }) {
  const navigate = useNavigate();
  const { exams, loading, reload } = useSpeakingExams();

  const saveExam = async (data) => {
    const payload = { title: data.title, topic: data.topic, subtopic: data.subtopic, custom_code: data.customCode || '', annotations: data.annotations || {}, part_a: { ...data.partA, focus_ideas: data.partA?.focusIdeas || [] }, part_b: data.partB || [], is_published: true };
    if (data.id) await contentApi.update('SpeakingExam', data.id, payload);
    else await contentApi.create('SpeakingExam', payload);
    navigate('/speaking');
  };

  const handleSaveAnnotation = async (examId, word, meaning) => {
    const exam = await base44.entities.SpeakingExam.get(examId);
    const annotations = { ...(exam.annotations || {}) };
    if (!meaning) delete annotations[word]; else annotations[word] = meaning;
    await contentApi.update('SpeakingExam', examId, { annotations });
    reload();
  };

  return (
    <Routes>
      <Route path="/speaking" element={
        loading
          ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : <SpeakingLibrary exams={exams} isEditor={isEditor}
              onView={p => navigate(`/speaking/read/${p.id}`)}
              onEdit={p => navigate(p ? `/speaking/edit/${p.id}` : '/speaking/edit/new')}
              onDelete={async id => { await contentApi.delete('SpeakingExam', id); reload(); }}
              onBulkImport={undefined}
            />
      } />
      <Route path="/speaking/read/:id" element={(() => {
        const W = () => {
          const [exam, setExam] = useState(null);
          const id = window.location.pathname.split('/').pop();
          useEffect(() => {
            base44.entities.SpeakingExam.get(id).then(e => setExam({
              ...e,
              annotations: e.annotations || {},
              partA: e.part_a ? { ...e.part_a, focusIdeas: e.part_a.focus_ideas || e.part_a.focusIdeas || [] } : {},
              partB: e.part_b || [],
            }));
          }, [id]);
          if (!exam) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <SpeakingReadView exam={exam} isEditor={isEditor} onBack={() => navigate('/speaking')} onSaveAnnotation={handleSaveAnnotation} />;
        };
        return <W />;
      })()} />
      <Route path="/speaking/edit/:id" element={(() => {
        const W = () => {
          const [exam, setExam] = useState(undefined);
          const idStr = window.location.pathname.split('/').pop();
          useEffect(() => {
            if (idStr === 'new') { setExam(null); return; }
            base44.entities.SpeakingExam.get(idStr).then(e => setExam({
              ...e,
              annotations: e.annotations || {},
              partA: e.part_a ? { ...e.part_a, focusIdeas: e.part_a.focus_ideas || e.part_a.focusIdeas || [] } : {},
              partB: e.part_b || [],
            }));
          }, [idStr]);
          if (exam === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <SpeakingEditor exam={exam} onSave={saveExam} onCancel={() => navigate('/speaking')} />;
        };
        return <W />;
      })()} />
    </Routes>
  );
}