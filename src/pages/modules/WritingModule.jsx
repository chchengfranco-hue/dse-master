import { useState, useCallback, useRef } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { TOPIC_TREE } from '@/lib/topicTree';
import { useLocalData } from '@/hooks/useLocalData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';

const STORAGE_KEY = 'writingModels';


const defaultModels = [
  {
    id: 1,
    title: 'Climate Change — Argumentative Essay',
    topic: 'Environment', subtopic: 'Climate',
    imageUrl: '',
    question: 'Many people believe that individuals have a responsibility to take action on climate change. To what extent do you agree with this view? Write an argumentative essay of 400–450 words.',
    content: `Climate change stands as one of the most pressing challenges of our era, and the question of individual responsibility has never been more urgent. While systemic change at governmental and corporate levels is indispensable, I firmly believe that individuals must also embrace their role in combating this crisis.

To begin with, the cumulative impact of individual choices is profound. When millions of people opt for plant-based diets, reduce air travel, or choose renewable energy providers, the aggregate effect on carbon emissions is substantial. According to a study published in Nature, if ten percent of the world's population adopted a low-carbon lifestyle, global emissions could fall by a third.

Furthermore, individual action catalyses broader change. When consumers prioritise sustainable products, they send powerful market signals to corporations. Businesses, driven by profit motives, will inevitably shift towards greener practices when they recognise that sustainability is not merely an ethical imperative but a commercial advantage.

Admittedly, critics argue that the burden of addressing climate change should not fall disproportionately on individuals while large corporations continue to emit greenhouse gases unchecked. This perspective has considerable merit; structural reforms are undeniably necessary.

However, dichotomising individual and collective action creates a false dilemma. Both must operate in tandem. A society of environmentally conscious citizens is far more likely to elect progressive governments and support ambitious climate policies.

In conclusion, while systemic change is imperative, individuals are neither powerless nor absolved of responsibility. Our everyday choices, multiplied across billions of people, possess the transformative potential to reshape our planet's future.`,
    annotations: {
      indispensable: 'adj. absolutely necessary',
      cumulative: 'adj. increasing by successive additions',
      aggregate: 'adj. total or combined',
      catalyses: 'v. causes or speeds up',
      imperative: 'adj. of vital importance',
      dichotomising: 'v. dividing into two contrasting parts',
      tandem: 'n. alongside each other',
    },
  },
  {
    id: 2,
    title: 'Social Media — Discursive Essay',
    topic: 'Technology', subtopic: 'Social Media',
    imageUrl: '',
    question: 'Some people believe that social media has done more harm than good to society. Discuss both sides of the argument and give your own view. Write 400–450 words.',
    content: `Social media has fundamentally transformed the fabric of modern communication. While its benefits in connectivity and information dissemination are undeniable, its detrimental effects on mental health, social cohesion, and the spread of misinformation warrant serious consideration.

Proponents of social media highlight its unparalleled capacity to connect individuals across geographical boundaries. Platforms like Facebook and Twitter have facilitated the formation of communities around shared interests, enabling marginalized groups to amplify their voices and mobilize for social change. The Arab Spring and #MeToo movement are prominent examples of social media's potential to galvanize collective action.

Moreover, social media serves as a vital conduit for information sharing. During global crises, such as the COVID-19 pandemic, it provided real-time updates and fostered a sense of solidarity among communities worldwide.

However, the drawbacks are equally significant. Studies consistently demonstrate a correlation between heavy social media use and heightened levels of anxiety, depression, and loneliness, particularly among adolescents. The curated nature of social media content cultivates unrealistic comparisons and a perpetual sense of inadequacy.

Furthermore, the proliferation of misinformation on these platforms poses a grave threat to democratic institutions. Algorithms designed to maximise engagement frequently amplify sensationalist content, creating echo chambers that polarize public discourse.

In my view, the challenge lies not in eliminating social media but in cultivating digital literacy and implementing robust regulatory frameworks. When used mindfully, social media possesses immense potential for good. The key is ensuring that its design prioritizes well-being over engagement metrics.`,
    annotations: {
      dissemination: 'n. the spreading of something widely',
      marginalized: 'adj. treated as unimportant or powerless',
      galvanize: 'v. to shock into taking action',
      conduit: 'n. a channel for conveying something',
      proliferation: 'n. rapid increase in number',
      polarize: 'v. divide into contrasting groups',
    },
  },
];

const load = () => { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultModels; } catch { return defaultModels; } };
const persist = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

function speak(text) { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.85; window.speechSynthesis.speak(u); }
function getPoSClass(m) { const t = (m || '').trim().toLowerCase(); if (/^n\./.test(t)) return 'pos-noun'; if (/^v\./.test(t)) return 'pos-verb'; if (/^adj\./.test(t)) return 'pos-adj'; if (/^adv\./.test(t)) return 'pos-adv'; return 'pos-other'; }
function posColorBorder(m) { const c = getPoSClass(m); if (c === 'pos-noun') return 'border-l-4 border-blue-400 bg-blue-50'; if (c === 'pos-verb') return 'border-l-4 border-red-400 bg-red-50'; if (c === 'pos-adj') return 'border-l-4 border-emerald-400 bg-emerald-50'; if (c === 'pos-adv') return 'border-l-4 border-amber-400 bg-amber-50'; return 'border-l-4 border-border bg-muted/40'; }

// --- Annotated Passage ---
function AnnotatedContent({ text, annotations, showRuby, activeWord, onWordClick }) {
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

// --- Editor ---
function WritingEditor({ model, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: model?.id || null,
    title: model?.title || '',
    topic: model?.topic || '',
    subtopic: model?.subtopic || '',
    imageUrl: model?.imageUrl || '',
    question: model?.question || '',
    content: model?.content || '',
    annotationsText: model?.annotations ? Object.entries(model.annotations).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleTopicChange = (e) => {
    const newTopic = e.target.value;
    // Reset subtopic when topic changes
    setForm(p => ({ ...p, topic: newTopic, subtopic: '' }));
  };

  const subtopics = form.topic && TOPIC_TREE[form.topic] ? TOPIC_TREE[form.topic] : [];

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return alert('Title and Content are required.');
    const annotations = {};
    form.annotationsText.split('\n').forEach(line => { const idx = line.indexOf(':'); if (idx > 0) { const w = line.slice(0, idx).trim(), m = line.slice(idx + 1).trim(); if (w && m) annotations[w] = m; } });
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic || 'Uncategorized', subtopic: form.subtopic || 'General', imageUrl: form.imageUrl.trim(), question: form.question.trim(), content: form.content.trim(), annotations });
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Writing Model' : 'Add Writing Model'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select
            className="rounded-xl border border-input px-3 py-2 text-sm bg-background"
            value={form.topic}
            onChange={handleTopicChange}
          >
            <option value="">— Select Main Topic —</option>
            {Object.keys(TOPIC_TREE).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-input px-3 py-2 text-sm bg-background disabled:opacity-50"
            value={form.subtopic}
            onChange={e => s('subtopic', e.target.value)}
            disabled={!form.topic}
          >
            <option value="">— Select Sub-topic —</option>
            {subtopics.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <input className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-3" placeholder="Prompt / Essay Title" value={form.title} onChange={e => s('title', e.target.value)} />
        <input className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-3" placeholder="Image URL (Optional)" value={form.imageUrl} onChange={e => s('imageUrl', e.target.value)} />
        <p className="text-xs font-semibold text-foreground mb-1">Exam Question / Prompt</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y mb-3" placeholder="Enter the exam question or writing prompt here..." value={form.question} onChange={e => s('question', e.target.value)} />
        <p className="text-xs font-semibold text-foreground mb-1">Model Essay / Writing</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-3" placeholder="Paste the model essay or writing here..." value={form.content} onChange={e => s('content', e.target.value)} />
        <p className="text-xs text-muted-foreground mb-2"><strong>Batch Annotations (Optional):</strong> <code className="bg-muted px-1 rounded">word: meaning</code> one per line.</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y mb-5" placeholder={"word: definition\nword: definition"} value={form.annotationsText} onChange={e => s('annotationsText', e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border transition-colors border border-border">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Library ---
function WritingLibrary({ models, isEditor, onView, onEdit, onDelete, onBulkImport }) {
  const [sel, setSel] = useState('All'); const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const PER = 10;
  const topicTree = {};
  models.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });
  const filtered = models.filter(p => {
    const tm = sel === 'All' || (selSub ? p.topic === sel && p.subtopic === selSub : p.topic === sel);
    const sm = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return tm && sm;
  });
  const paged = filtered.slice((page - 1) * PER, page * PER);
  const totalPages = Math.ceil(filtered.length / PER);
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Writing Models Library</h1><p className="text-sm text-muted-foreground mt-1">Sample essays and writing models for HKDSE</p></div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border select-none">📥 Import</button>}
          {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none">+ Add Writing Model</button>}
        </div>
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search writing models..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Models ({models.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({models.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st} ({models.filter(p => p.topic === t && p.subtopic === st).length})</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No writing models found.</div>}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md active:scale-[0.98] active:bg-muted transition-all cursor-pointer card-item">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                {p.question && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">{p.question}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}</span>}
                  {p.subtopic && p.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">{p.subtopic}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">View Model</button>
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
function WritingReadView({ model, isEditor, onBack, onSaveAnnotation }) {
  const [showRuby, setShowRuby] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const annotations = model.annotations || {};
  const annotationCount = Object.keys(annotations).length;

  const handleWordClick = (word) => { speak(word); if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word); };

  const handlePrint = () => window.print();

  const playFull = () => speak(model.content);

  const handleTextSelect = useCallback(() => {
    if (!isEditor) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0 && sel.length < 35 && !sel.includes('\n')) {
      setTimeout(() => {
        const meaning = prompt(`Add annotation for "${sel}":\n(Leave blank to remove)`);
        if (meaning !== null) { onSaveAnnotation(model.id, sel, meaning.trim()); window.getSelection()?.removeAllRanges(); }
      }, 50);
    }
  }, [isEditor, model.id, onSaveAnnotation]);

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors">← Back to Library</button>
        <div className="flex flex-wrap gap-2">
          <button onClick={playFull} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Model</button>
          <button onClick={() => { const s = window.getSelection()?.toString().trim(); if (s) speak(s); else alert('Please highlight text first.'); }} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Selection</button>
          <button onClick={() => window.speechSynthesis?.cancel()} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">⏹ Stop</button>
          {annotationCount > 0 && <>
            <button onClick={() => setShowRuby(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>📖 {showRuby ? 'Hide' : 'Show'} Ruby</button>
            <button onClick={() => setShowMargin(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}
          <button onClick={handlePrint} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors select-none">🖨️ Print</button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{model.title}</h2>
        {model.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{model.topic}{model.subtopic && model.subtopic !== 'General' ? ` › ${model.subtopic}` : ''}</span>}
      </div>

      {/* Question Box */}
      {model.question && (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 mb-5">
          <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wide mb-2">📋 Exam Question</h3>
          <p className="text-base text-foreground leading-relaxed">{model.question}</p>
          {/* Student answer box */}
          <div className="mt-4 no-print">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Answer (for practice):</p>
            <textarea
              className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm min-h-32 resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="Write your own answer here for practice before reading the model..."
            />
          </div>
        </div>
      )}

      {isEditor && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm"><strong>Editor Mode:</strong> Highlight any word or phrase to add/remove an annotation.</div>}

      {model.imageUrl && <img src={model.imageUrl} alt="Theme" className="max-h-72 rounded-2xl mb-5 object-cover" />}

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 lg:p-8 text-base leading-loose" onMouseUp={handleTextSelect}>
          <AnnotatedContent text={model.content} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} />
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

function WritingBulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); onImport(Array.isArray(data) ? data : [data]); } catch { alert('Invalid JSON file.'); } };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Writing Models</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file with an array of writing model objects. Each needs <code className="bg-muted px-1 rounded">title</code> and <code className="bg-muted px-1 rounded">content</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border select-none">Cancel</button>
      </div>
    </div>
  );
}

// --- Main Module ---
export default function WritingModule({ isEditor }) {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [models, setModels] = useLocalData(STORAGE_KEY, defaultModels);
  const refreshing = usePullToRefresh(() => { setModels(load()); }, listRef);

  const update = (data) => { setModels(data); persist(data); };
  const saveModel = (data) => {
    if (data.id) update(models.map(m => m.id === data.id ? data : m));
    else update([...models, { ...data, id: Date.now() }]);
    navigate('/writing');
  };
  const handleSaveAnnotation = (modelId, word, meaning) => {
    const updated = models.map(m => {
      if (m.id !== modelId) return m;
      const annotations = { ...(m.annotations || {}) };
      if (!meaning) delete annotations[word]; else annotations[word] = meaning;
      return { ...m, annotations };
    });
    update(updated);
  };

  return (
    <Routes>
      <Route path="/writing" element={
        <>
          <PullRefreshIndicator refreshing={refreshing} />
          <WritingLibrary models={models} isEditor={isEditor}
            onView={p => navigate(`/writing/read/${p.id}`)}
            onEdit={p => navigate(p ? `/writing/edit/${p.id}` : '/writing/edit/new')}
            onDelete={id => update(models.filter(m => m.id !== id))}
            onBulkImport={isEditor ? () => navigate('/writing/bulk') : undefined}
          />
        </>
      } />
      <Route path="/writing/read/:id" element={(() => {
        const W = () => { const [ms] = useLocalData(STORAGE_KEY, defaultModels); const id = parseInt(window.location.pathname.split('/').pop()); const model = ms.find(m => m.id === id) || ms[0]; return model ? <WritingReadView model={model} isEditor={isEditor} onBack={() => navigate('/writing')} onSaveAnnotation={handleSaveAnnotation} /> : null; };
        return <W />;
      })()} />
      <Route path="/writing/edit/:id" element={(() => {
        const W = () => { const [ms] = useLocalData(STORAGE_KEY, defaultModels); const idStr = window.location.pathname.split('/').pop(); const model = idStr === 'new' ? null : ms.find(m => m.id === parseInt(idStr)); return <WritingEditor model={model} onSave={saveModel} onCancel={() => navigate('/writing')} />; };
        return <W />;
      })()} />
      <Route path="/writing/bulk" element={<WritingBulkImport onImport={(arr) => { update([...models, ...arr.map(p => ({ ...p, id: Date.now() + Math.random() }))]); navigate('/writing'); }} onCancel={() => navigate('/writing')} />} />
    </Routes>
  );
}