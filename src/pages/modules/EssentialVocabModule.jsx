import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { contentApi } from '@/lib/contentApi';


function useVocabSets(isEditor) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.VocabSet.list('-created_date', 200);
    const filtered = isEditor ? data : data.filter(s => s.status === 'published' || (s.status == null && s.is_published !== false));
    setSets(filtered.map(s => ({ ...s, vocabData: s.vocab_data || [], customCode: s.custom_code || '' })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { sets, loading, reload: load };
}

const STORAGE_KEY = 'essentialVocabSets';

const defaultSets = [
  {
    id: 1,
    title: 'Core Vocabulary - Environment',
    topic: 'Environment', subtopic: 'Climate',
    customCode: 'EV-001',
    passage: 'The proliferation of greenhouse gases has exacerbated climate change, leading to unprecedented weather events. Governments must implement stringent measures to curtail emissions and mitigate the devastating effects on vulnerable communities.',
    vocabData: [
      { word: 'proliferation', pos: 'n.', meaning: 'rapid increase in numbers', example: 'The proliferation of social media platforms changed communication.' },
      { word: 'exacerbated', pos: 'v.', meaning: 'made (a problem) worse', example: 'Poor planning exacerbated the crisis.' },
      { word: 'unprecedented', pos: 'adj.', meaning: 'never done or known before', example: 'The flooding was unprecedented in its severity.' },
      { word: 'stringent', pos: 'adj.', meaning: 'strict and precise', example: 'Stringent safety standards are enforced.' },
      { word: 'curtail', pos: 'v.', meaning: 'reduce or limit', example: 'They tried to curtail spending.' },
      { word: 'mitigate', pos: 'v.', meaning: 'make less severe', example: 'Plants help mitigate air pollution.' },
    ],
  },
];

const load = () => { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultSets; } catch { return defaultSets; } };
const persist = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

function escHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function getPoSClass(pos) {
  const m = (pos || '').trim().toLowerCase();
  if (/^n\./.test(m)) return 'pos-noun';
  if (/^v\./.test(m)) return 'pos-verb';
  if (/^adj\./.test(m)) return 'pos-adj';
  if (/^adv\./.test(m)) return 'pos-adv';
  return 'pos-other';
}

function posColor(pos) {
  const c = getPoSClass(pos);
  if (c === 'pos-noun') return 'border-l-4 border-blue-400 bg-blue-50';
  if (c === 'pos-verb') return 'border-l-4 border-red-400 bg-red-50';
  if (c === 'pos-adj') return 'border-l-4 border-emerald-400 bg-emerald-50';
  if (c === 'pos-adv') return 'border-l-4 border-amber-400 bg-amber-50';
  return 'border-l-4 border-border bg-muted/40';
}

function speak(text) { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.95; window.speechSynthesis.speak(u); }

// --- Annotated Passage ---
function AnnotatedPassage({ passage, vocabData, showRuby, activeWord, onWordClick }) {
  if (!passage || !vocabData?.length) return null;
  const words = vocabData.map(v => v.word).filter(Boolean);
  if (!words.length) return <p className="whitespace-pre-wrap">{passage}</p>;
  const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = [];
  let last = 0, m;
  while ((m = regex.exec(passage)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: passage.slice(last, m.index) });
    const vd = vocabData.find(v => v.word.toLowerCase() === m[1].toLowerCase());
    parts.push({ type: 'word', value: m[1], vd });
    last = m.index + m[1].length;
  }
  if (last < passage.length) parts.push({ type: 'text', value: passage.slice(last) });
  return (
    <span className="whitespace-pre-wrap text-foreground leading-loose">
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.value}</span>;
        const meaning = (p.vd?.pos ? p.vd.pos + ' ' : '') + (p.vd?.meaning || '');
        const isActive = activeWord === p.vd?.word;
        if (showRuby) return (
          <ruby key={i} onClick={() => onWordClick(p.vd?.word)} className="cursor-pointer font-semibold" style={{ rubyAlign: 'center' }}>
            {p.value}<rt style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', lineHeight: 1 }}>{meaning}</rt>
          </ruby>
        );
        return (
          <span key={i} onClick={() => onWordClick(p.vd?.word)}
            className={`cursor-pointer rounded px-0.5 border-b border-dashed transition-all ${isActive ? 'bg-yellow-200 text-yellow-900 border-transparent font-semibold' : 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-yellow-100'}`}>
            {p.value}
          </span>
        );
      })}
    </span>
  );
}

// --- Editor ---
function EVEditor({ set, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: set?.id || null,
    title: set?.title || '',
    topic: set?.topic || '',
    subtopic: set?.subtopic || '',
    customCode: set?.customCode || '',
    passage: set?.passage || '',
    status: set?.status || 'published',
    batchVocab: set?.vocabData ? set.vocabData.map(v => `${v.word} | ${v.pos} | ${v.meaning} | ${v.example}`).join('\n') : '',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim()) return alert('Title is required.');
    const vocabData = form.batchVocab.trim().split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split('|');
      return { word: (parts[0] || '').trim(), pos: (parts[1] || '').trim(), meaning: (parts[2] || '').trim(), example: (parts[3] || '').trim() };
    }).filter(v => v.word);
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic.trim() || 'Uncategorized', subtopic: form.subtopic.trim() || 'General', customCode: form.customCode.trim(), passage: form.passage.trim(), vocabData, status: form.status });
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Vocab Set' : 'Add Vocabulary Set'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Main Topic (e.g. Environment)" value={form.topic} onChange={e => s('topic', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Sub-topic (e.g. Pollution)" value={form.subtopic} onChange={e => s('subtopic', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm col-span-2 sm:col-span-1" placeholder="Vocab Set Title" value={form.title} onChange={e => s('title', e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Custom Code (e.g. EV-001)" value={form.customCode} onChange={e => s('customCode', e.target.value)} />
        </div>
        <h3 className="text-sm font-bold text-primary mb-2 mt-4 border-b border-border pb-1">1. Contextual Passage (Optional)</h3>
        <p className="text-xs text-muted-foreground mb-2">Vocabulary words will be automatically highlighted in the passage.</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-28 resize-y mb-4" placeholder="Optional short passage demonstrating vocabulary in context..." value={form.passage} onChange={e => s('passage', e.target.value)} />
        <h3 className="text-sm font-bold text-primary mb-2 border-b border-border pb-1">2. Vocabulary List (Batch Input)</h3>
        <p className="text-xs text-muted-foreground mb-1">Format: <code className="bg-muted px-1 rounded">Word | PoS | Meaning | Example Sentence</code> (one per line)</p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">PoS: n. (Noun), v. (Verb), adj. (Adjective), adv. (Adverb)</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-5" placeholder={"abandon | v. | to leave behind | They abandoned the car.\nrapidly | adv. | very quickly | The disease spread rapidly."} value={form.batchVocab} onChange={e => s('batchVocab', e.target.value)} />
        <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-xl border border-border">
          <span className="text-sm font-medium text-foreground">Status:</span>
          <button onClick={() => s('status', 'draft')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'draft' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>🔒 Draft</button>
          <button onClick={() => s('status', 'published')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'published' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>✅ Published</button>
          <span className="text-xs text-muted-foreground ml-1">{form.status === 'draft' ? 'Only visible to editors' : 'Visible to all students'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Save Vocab Set</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library ---
function EVLibrary({ sets, isEditor, onView, onEdit, onDelete, onBulkImport }) {
  const [sel, setSel] = useState('All'); const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const PER = 10;
  const topicTree = {};
  sets.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });
  const filtered = sets.filter(p => {
    const tm = sel === 'All' || (selSub ? p.topic === sel && p.subtopic === selSub : p.topic === sel);
    const sm = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return tm && sm;
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(filtered.length / PER);
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Essential Vocabulary</h1><p className="text-sm text-muted-foreground mt-1">HKDSE vocabulary sets with context passages</p></div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border select-none">📥 Import</button>}
          {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none">+ Add Vocab Set</button>}
        </div>
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search vocab sets..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Vocab Sets ({sets.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({sets.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st} ({sets.filter(p => p.topic === t && p.subtopic === st).length})</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No vocab sets found.</div>}
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
                  {p.vocabData?.length > 0 && <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{p.vocabData.length} words</span>}
                  {isEditor && p.status === 'draft' && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">🔒 Draft</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">View</button>
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
function EVReadView({ set, onBack }) {
  const [vocabView, setVocabView] = useState('list');
  const [showRuby, setShowRuby] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const vocab = set.vocabData || [];

  const handleWordClick = (word) => {
    if (word) speak(word);
    if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word);
  };

  const posColorClass = (pos) => {
    const c = getPoSClass(pos);
    if (c === 'pos-noun') return 'border-l-4 border-blue-400 bg-blue-50';
    if (c === 'pos-verb') return 'border-l-4 border-red-400 bg-red-50';
    if (c === 'pos-adj') return 'border-l-4 border-emerald-400 bg-emerald-50';
    if (c === 'pos-adv') return 'border-l-4 border-amber-400 bg-amber-50';
    return 'border-l-4 border-border bg-muted/40';
  };

  const categories = { 'Nouns': [], 'Verbs': [], 'Adjectives': [], 'Adverbs & Others': [] };
  vocab.forEach(v => {
    const c = getPoSClass(v.pos);
    if (c === 'pos-noun') categories['Nouns'].push(v);
    else if (c === 'pos-verb') categories['Verbs'].push(v);
    else if (c === 'pos-adj') categories['Adjectives'].push(v);
    else categories['Adverbs & Others'].push(v);
  });

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">← Back to Library</button>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { const s = window.getSelection()?.toString().trim(); if (s) speak(s); else alert('Please highlight text first.'); }} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Selection</button>
          <button onClick={() => window.speechSynthesis?.cancel()} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">⏹ Stop</button>
          {set.passage && vocab.length > 0 && <>
            <button onClick={() => setShowRuby(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>📖 {showRuby ? 'Hide' : 'Show'} Ruby</button>
            <button onClick={() => setShowMargin(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}
          <button onClick={() => window.print()} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors select-none no-print">🖨️ Print</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground">{set.title}</h2>
        </div>
        {set.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{set.topic}{set.subtopic && set.subtopic !== 'General' ? ` › ${set.subtopic}` : ''}</span>}
      </div>

      {set.passage && (
        <div className="flex gap-5 items-start mb-6">
          <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 text-base leading-loose">
            <AnnotatedPassage passage={set.passage} vocabData={vocab} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />
          </div>
          {showMargin && vocab.length > 0 && (
            <aside className="w-40 shrink-0 flex flex-col gap-2.5 pt-1">
              {vocab.filter(v => v.word).map(v => (
                <div key={v.word} onMouseEnter={() => setActiveWord(v.word)} onMouseLeave={() => setActiveWord(null)}
                  className={`rounded-lg px-3 py-2 text-[11px] leading-snug cursor-pointer transition-all duration-150 ${posColorClass(v.pos)} ${activeWord === v.word ? 'shadow-md -translate-x-0.5' : ''}`}>
                  <strong className="block text-[12px] text-primary mb-0.5">{v.word}</strong>
                  {v.pos && <span className="italic text-muted-foreground">{v.pos} </span>}{v.meaning}
                </div>
              ))}
            </aside>
          )}
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setVocabView('list')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${vocabView === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'}`}>📄 List View</button>
        <button onClick={() => setVocabView('table')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${vocabView === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'}`}>🗂️ PoS Table View</button>
      </div>

      {vocabView === 'list' && (
        <div className="space-y-3">
          {vocab.filter(v => v.word).map(v => (
            <div key={v.word} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <button onClick={() => speak(v.word)} className="text-lg font-bold text-primary hover:text-primary/80">🔊 {v.word}</button>
                {v.pos && <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{v.pos}</span>}
                {v.meaning && <span className="font-medium text-base">{v.meaning}</span>}
              </div>
              {v.example && <p className="text-sm text-muted-foreground italic">"{v.example}"</p>}
            </div>
          ))}
          {vocab.length === 0 && <p className="text-muted-foreground">No vocabulary inputted yet.</p>}
        </div>
      )}

      {vocabView === 'table' && (
        <div>
          {Object.entries(categories).map(([cat, items]) => items.length === 0 ? null : (
            <div key={cat} className="mb-6">
              <h3 className="text-base font-bold text-primary mb-2 border-b border-border pb-1">{cat}</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full border-collapse">
                  <thead><tr className="bg-primary text-primary-foreground"><th className="text-left px-4 py-2 text-sm w-1/4">Word</th><th className="text-left px-4 py-2 text-sm w-1/3">Meaning</th><th className="text-left px-4 py-2 text-sm">Example</th></tr></thead>
                  <tbody>
                    {items.map(v => (
                      <tr key={v.word} className="border-t border-border">
                        <td className="px-4 py-2"><button onClick={() => speak(v.word)} className="font-bold text-primary text-sm hover:text-primary/80">🔊 {v.word}</button></td>
                        <td className="px-4 py-2 text-sm">{v.meaning}</td>
                        <td className="px-4 py-2 text-sm italic text-muted-foreground">{v.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}

function EVBulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); onImport(Array.isArray(data) ? data : [data]); } catch { alert('Invalid JSON file.'); } };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Vocab Sets</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file with an array of vocab set objects. Each needs at least <code className="bg-muted px-1 rounded">title</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border select-none">Cancel</button>
      </div>
    </div>
  );
}

// --- Main Module ---
export default function EssentialVocabModule({ isEditor }) {
  const navigate = useNavigate();
  const { sets, loading, reload } = useVocabSets(isEditor);

  const saveSet = async (data) => {
    const payload = { title: data.title, topic: data.topic, subtopic: data.subtopic, custom_code: data.customCode || '', passage: data.passage || '', vocab_data: data.vocabData || [], status: data.status || 'published', is_published: data.status !== 'draft' };
    if (data.id) await contentApi.update('VocabSet', data.id, payload);
    else await contentApi.create('VocabSet', payload);
    navigate('/essential');
  };

  return (
    <Routes>
      <Route path="/essential" element={
        loading
          ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : <EVLibrary sets={sets} isEditor={isEditor}
              onView={p => navigate(`/essential/read/${p.id}`)}
              onEdit={p => navigate(p ? `/essential/edit/${p.id}` : '/essential/edit/new')}
              onDelete={async id => { await contentApi.delete('VocabSet', id); reload(); }}
              onBulkImport={undefined}
            />
      } />
      <Route path="/essential/read/:id" element={(() => {
        const W = () => {
          const [set, setSet] = useState(null);
          const id = window.location.pathname.split('/').pop();
          useEffect(() => { base44.entities.VocabSet.get(id).then(s => setSet({ ...s, vocabData: s.vocab_data || [], customCode: s.custom_code || '' })); }, [id]);
          if (!set) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <EVReadView set={set} onBack={() => navigate('/essential')} />;
        };
        return <W />;
      })()} />
      <Route path="/essential/edit/:id" element={(() => {
        const W = () => {
          const [set, setSet] = useState(undefined);
          const idStr = window.location.pathname.split('/').pop();
          useEffect(() => {
            if (idStr === 'new') { setSet(null); return; }
            base44.entities.VocabSet.get(idStr).then(s => setSet({ ...s, vocabData: s.vocab_data || [], customCode: s.custom_code || '' }));
          }, [idStr]);
          if (set === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <EVEditor set={set} onSave={saveSet} onCancel={() => navigate('/essential')} />;
        };
        return <W />;
      })()} />
    </Routes>
  );
}