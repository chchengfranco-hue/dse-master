import { useState, useRef, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { contentApi } from '@/lib/contentApi';
import RichTextArea from '@/components/shared/RichTextArea';

function useClozeExercises(isEditor) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ClozeExercise.list('-created_date', 200);
    const filtered = isEditor ? data : data.filter(e => e.status === 'published' || (e.status == null && e.is_published !== false));
    setExercises(filtered.map(e => ({ ...e, hasOptions: e.has_options || 'bank', annotations: e.annotations || {}, mc_questions: e.mc_questions || [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { exercises, loading, reload: load };
}

const STORAGE_KEY = 'clozeExercises';
const DEFAULT = [
  {
    id: 1, title: 'Social Media and Youth', topic: 'Technology', subtopic: 'Social Media', hasOptions: 'bank',
    content: `Social media has [fundamentally|adv. completely and basically] [transformed|v. changed completely] the way young people [communicate|v. exchange information]. Platforms such as Instagram and TikTok have created [unprecedented|adj. never seen before] opportunities for [self-expression|n. sharing your feelings and ideas].\n\nHowever, researchers have raised concerns about the [detrimental|adj. causing harm] effects of excessive social media use. Studies [indicate|v. show] that prolonged exposure to curated online content can [exacerbate|v. make worse] feelings of inadequacy among teenagers.`,
    annotations: { fundamentally: 'adv. completely and basically', transformed: 'v. changed completely', unprecedented: 'adj. never seen before', detrimental: 'adj. causing harm', exacerbate: 'v. make worse' },
  },
];

const load = () => { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT; } catch { return DEFAULT; } };
const saveStorage = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

function parseClozeTokens(raw) {
  const regex = /\[([^\]\|]+)(?:\|([^\]]+))?\]/g;
  const parts = []; let last = 0; let match;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: raw.slice(last, match.index) });
    const wordParts = match[1].split('/');
    parts.push({ type: 'blank', correct: wordParts[0].trim(), distractors: wordParts.slice(1).map(s => s.trim()), explanation: match[2] || '' });
    last = match.index + match[0].length;
  }
  if (last < raw.length) parts.push({ type: 'text', value: raw.slice(last) });
  return parts;
}

const WORDBANK_SEP = '\n---WORDBANK---\n';

function splitContentAndBank(raw) {
  const idx = raw.indexOf(WORDBANK_SEP);
  if (idx === -1) return { passageContent: raw, bankText: '' };
  return { passageContent: raw.slice(0, idx), bankText: raw.slice(idx + WORDBANK_SEP.length) };
}

function joinContentAndBank(passage, bankText) {
  if (!bankText.trim()) return passage;
  return passage + WORDBANK_SEP + bankText.trim();
}

function buildWordBank(tokens, explicitBankText) {
  if (explicitBankText && explicitBankText.trim()) {
    return explicitBankText.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
  }
  return [...new Set(tokens.filter(t => t.type === 'blank').map(t => t.correct))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function AnnotatedText({ text, annotations, showRuby, activeWord, onWordClick }) {
  if (!annotations || !Object.keys(annotations).length) return <span className="whitespace-pre-wrap">{text}</span>;
  const words = Object.keys(annotations);
  const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = []; let last = 0, m;
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

function ClozeContent({ tokens, hasOptions, answers, setAnswers, submitted, annotations, showRuby, activeWord, onWordClick, explicitBankText }) {
  const bank = buildWordBank(tokens, explicitBankText);
  let blankIndex = 0;
  return (
    <span>
      {tokens.map((token, i) => {
        if (token.type === 'text') return <AnnotatedText key={i} text={token.value} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={onWordClick} />;
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
          return (
            <span key={i} className="inline-flex flex-col items-center align-middle mx-1 my-1">
              <Select
                disabled={submitted}
                value={userAns || ''}
                onValueChange={(val) => setAnswers(a => { const n = [...a]; n[idx] = val; return n; })}
              >
                <SelectTrigger className={`h-8 min-w-[100px] text-sm border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-1 focus:ring-0 ${submitted ? (isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700') : 'border-primary text-primary'}`}>
                  <SelectValue placeholder="…" />
                </SelectTrigger>
                <SelectContent>
                  {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {expEl}
            </span>
          );
        }
        const w = Math.max(90, correct.length * 12 + 10);
        return (
          <span key={i} className="inline-flex flex-col items-center align-middle mx-1">
            <input type="text" disabled={submitted} value={userAns}
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

function MCClozeQuestionsEditor({ questions, onChange }) {
  const addQuestion = () => {
    const next = questions.length + 1;
    onChange([...questions, { blank_id: `BLANK_${next}`, options: ['', '', '', ''], correct: '', explanation: '' }]);
  };
  const updateQuestion = (i, field, value) => {
    const updated = questions.map((q, qi) => qi === i ? { ...q, [field]: value } : q);
    onChange(updated);
  };
  const updateOption = (qi, oi, value) => {
    const updated = questions.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q);
    onChange(updated);
  };
  const removeQuestion = (i) => onChange(questions.filter((_, qi) => qi !== i));

  return (
    <div className="space-y-4 mb-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Questions & Options</p>
        <button type="button" onClick={addQuestion} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90">+ Add Question</button>
      </div>
      {questions.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No questions yet. Add a question for each [BLANK_N] in your passage.</p>
      )}
      {questions.map((q, qi) => (
        <div key={qi} className="bg-muted/40 rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{q.blank_id || `BLANK_${qi+1}`}</span>
              <input className="rounded-lg border border-input px-2 py-1 text-xs flex-1" placeholder="Blank ID (e.g. BLANK_1)" value={q.blank_id} onChange={e => updateQuestion(qi, 'blank_id', e.target.value)} />
            </div>
            <button type="button" onClick={() => removeQuestion(qi)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['A', 'B', 'C', 'D'].map((letter, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{letter}.</span>
                <input className="rounded-lg border border-input px-2 py-1.5 text-sm flex-1" placeholder={`Option ${letter}`} value={q.options[oi] || ''} onChange={e => updateOption(qi, oi, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground shrink-0">Correct:</span>
            <Select value={q.correct} onValueChange={v => updateQuestion(qi, 'correct', v)}>
              <SelectTrigger className="h-8 text-xs rounded-lg flex-1"><SelectValue placeholder="Select correct answer" /></SelectTrigger>
              <SelectContent>
                {q.options.filter(o => o.trim()).map((o, oi) => <SelectItem key={oi} value={o}>{['A','B','C','D'][oi]}. {o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <input className="w-full rounded-lg border border-input px-2 py-1.5 text-xs" placeholder="Explanation (optional, shown after submission)" value={q.explanation || ''} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} />
        </div>
      ))}
    </div>
  );
}

function ClozeEditor({ exercise, onSave, onCancel }) {
  const { passageContent: initPassage, bankText: initBank } = splitContentAndBank(exercise?.content || '');
  const [form, setForm] = useState({
    id: exercise?.id || null, title: exercise?.title || '', topic: exercise?.topic || '',
    subtopic: exercise?.subtopic || '', hasOptions: exercise?.hasOptions || 'bank',
    passageContent: initPassage,
    bankText: initBank,
    status: exercise?.status || 'published',
    mc_questions: exercise?.mc_questions || [],
    annotationsText: exercise?.annotations ? Object.entries(exercise.annotations).map(([k, v]) => `${k}: ${v}`).join('\n') : '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim() || !form.passageContent.trim()) return alert('Title and Content are required.');
    const annotations = {};
    form.annotationsText.split('\n').forEach(line => { const idx = line.indexOf(':'); if (idx > 0) { const w = line.slice(0, idx).trim(), m = line.slice(idx + 1).trim(); if (w && m) annotations[w] = m; } });
    const content = form.hasOptions === 'bank' ? joinContentAndBank(form.passageContent.trim(), form.bankText) : form.passageContent.trim();
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic.trim() || 'Uncategorized', subtopic: form.subtopic.trim() || 'General', hasOptions: form.hasOptions, content, annotations, status: form.status, mc_questions: form.hasOptions === 'mccloze' ? form.mc_questions : [] });
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
          <Select value={form.hasOptions} onValueChange={v => set('hasOptions', v)}>
            <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">Text Input (With Word Bank)</SelectItem>
              <SelectItem value="nobank">Text Input (Without Word Bank)</SelectItem>
              <SelectItem value="mcq">Multiple Choice Dropdown</SelectItem>
              <SelectItem value="mccloze">MC Cloze (4 Options per Blank)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.hasOptions === 'mccloze' ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">Write your passage using <code className="bg-muted px-1 rounded">[BLANK_1]</code>, <code className="bg-muted px-1 rounded">[BLANK_2]</code>, etc. as placeholders for each blank.</p>
            <RichTextArea value={form.passageContent} onChange={v => set('passageContent', v)} placeholder="e.g. The sky is [BLANK_1] and the grass is [BLANK_2]." minHeight="min-h-36" />
            <MCClozeQuestionsEditor questions={form.mc_questions} onChange={v => set('mc_questions', v)} />
          </>
        ) : form.hasOptions === 'bank' ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">Mark correct answers with brackets: <code className="bg-muted px-1 rounded">[word]</code> or <code className="bg-muted px-1 rounded">[word|explanation]</code>.</p>
            <RichTextArea value={form.passageContent} onChange={v => set('passageContent', v)} placeholder="Paste cloze passage here. Mark answers: The sky is [blue|adj. colour of clear sky]." minHeight="min-h-48" />
            <p className="text-xs font-semibold text-foreground mb-1 mt-1">Word Bank <span className="font-normal text-muted-foreground">(one word per line, or comma-separated — leave blank to auto-generate from passage)</span></p>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-20 resize-y mb-3"
              placeholder={"blue\ngreen\nred\nor: blue, green, red"}
              value={form.bankText}
              onChange={e => set('bankText', e.target.value)}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Enclose target words in brackets. Use pipe for explanation: <code className="bg-muted px-1 rounded">[word|explanation]</code>. For MCQ add wrong answers: <code className="bg-muted px-1 rounded">[fox/dog/cat|A wild animal]</code></p>
              {form.hasOptions === 'mcq' && (
                <button type="button" onClick={() => {
                  set('passageContent', `Climate change has [significantly/dramatically/slightly/rarely|adv. in an important way] [altered/improved/ignored/avoided|v. changed] weather patterns around the world. Scientists [warn/doubt/deny/forget|v. caution] that rising temperatures could [devastate/benefit/stabilise/celebrate|v. destroy badly] ecosystems and [displace/unite/protect/inspire|v. force to leave] millions of people.\n\nGovernments are now under [pressure/pleasure/leisure/treasure|n. strong demand] to [implement/ignore/debate/delay|v. put into action] policies that [reduce/increase/celebrate/maintain|v. lower] carbon [emissions/omissions/permissions/admissions|n. gases released] and [promote/prevent/replace/remove|v. encourage] the use of [renewable/reliable/remarkable/reversible|adj. naturally replenished] energy sources.`);
                  set('annotationsText', `significantly: adv. in an important way\naltered: v. changed\nwarn: v. caution\ndevastate: v. destroy badly\ndisplace: v. force to leave\npressure: n. strong demand\nimplement: v. put into action\nreduce: v. lower\nemissions: n. gases released into the air\npromote: v. encourage\nrenewable: adj. naturally replenished`);
                }} className="ml-3 shrink-0 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors whitespace-nowrap">
                  📋 Use Template
                </button>
              )}
            </div>
            <RichTextArea value={form.passageContent} onChange={v => set('passageContent', v)} placeholder="Paste exercise content here..." minHeight="min-h-48" />
          </>
        )}

        <p className="text-xs text-muted-foreground mb-2"><strong>Batch Annotations (Optional):</strong> <code className="bg-muted px-1 rounded">word: meaning</code> one per line.</p>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y mb-5" placeholder={"word: definition\nword: definition"} value={form.annotationsText} onChange={e => set('annotationsText', e.target.value)} />
        <div className="flex items-center gap-3 mb-5 p-3 bg-muted/50 rounded-xl border border-border">
          <span className="text-sm font-medium text-foreground">Status:</span>
          <button onClick={() => set('status', 'draft')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'draft' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>🔒 Draft</button>
          <button onClick={() => set('status', 'published')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'published' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>✅ Published</button>
          <span className="text-xs text-muted-foreground ml-1">{form.status === 'draft' ? 'Only visible to editors' : 'Visible to all students'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 select-none">Save</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border border border-border select-none">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ClozeLibrary({ exercises, isEditor, onView, onEdit, onDelete, onBulkImport, refreshing }) {
  const [selected, setSelected] = useState('All'); const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const PER = 10;
  const topicTree = {};
  exercises.forEach(p => { const t = p.topic || 'Uncategorized', st = p.subtopic || 'General'; if (!topicTree[t]) topicTree[t] = new Set(); if (st !== 'General') topicTree[t].add(st); });
  const filtered = exercises.filter(p => { const tm = selected === 'All' || (selSub ? p.topic === selected && p.subtopic === selSub : p.topic === selected); return tm && (!search || p.title.toLowerCase().includes(search.toLowerCase())); });
  const totalPages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice((page - 1) * PER, page * PER);
  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-foreground">Cloze Exercises</h1><p className="text-sm text-muted-foreground mt-1">Fill-in-the-blank vocabulary exercises</p></div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border select-none">📥 Import</button>}
          {isEditor && <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 select-none">+ Add Exercise</button>}
        </div>
      </div>
      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search exercises..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />
      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSelected('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 select-none ${selected === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Exercises ({exercises.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSelected(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 select-none ${selected === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({exercises.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSelected(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 select-none ${selected === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st}</button>
              ))}
            </div>
          ))}
        </aside>
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No exercises found.</div>}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md active:scale-[0.98] active:bg-muted transition-all card-item">
              <div>
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}</span>}
                  {p.subtopic && p.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">{p.subtopic}</span>}
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{p.hasOptions === 'bank' ? 'Word Bank' : p.hasOptions === 'mcq' ? 'MCQ Dropdown' : p.hasOptions === 'mccloze' ? 'MC Cloze' : 'Text Input'}</span>
                  {isEditor && p.status === 'draft' && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">🔒 Draft</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onView(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 select-none">Practice</button>
                {isEditor && <>
                  <button onClick={() => onEdit(p)} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border border border-border select-none">Edit</button>
                  <button onClick={() => { if (confirm('Delete?')) onDelete(p.id); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-200 select-none">Delete</button>
                </>}
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-border">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm disabled:opacity-40 select-none">Previous</button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm disabled:opacity-40 select-none">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MCClozeReadView({ exercise, onBack }) {
  const questions = exercise.mc_questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Shuffle options once on mount
  const [shuffledOptions] = useState(() =>
    questions.map(q => [...(q.options || [])].sort(() => 0.5 - Math.random()))
  );

  const score = submitted ? questions.filter(q => answers[q.blank_id] === q.correct).length : 0;

  // Render passage with inline answer boxes replacing [BLANK_N]
  const renderPassage = () => {
    const parts = (exercise.content || '').split(/(\[BLANK_\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[([^\]]+)\]$/);
      if (!match) return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      const blankId = match[1];
      const qIdx = questions.findIndex(q => q.blank_id === blankId);
      const userAns = answers[blankId];
      const isCorrect = submitted && userAns === questions[qIdx]?.correct;
      const isWrong = submitted && userAns && !isCorrect;
      return (
        <span key={i} style={{minWidth:'2cm'}} className={`inline-flex items-center justify-center mx-1 px-2 py-0.5 rounded-lg border font-semibold text-base align-baseline ${submitted ? (isCorrect ? 'bg-green-100 text-green-700 border-green-300' : isWrong ? 'bg-red-100 text-red-600 border-red-300 line-through' : 'bg-muted text-muted-foreground border-border') : 'bg-primary/10 text-primary border-primary/30'}`}>
          {userAns || <span className="text-muted-foreground text-sm">{(blankId.match(/\d+/) || [blankId])[0]}</span>}
        </span>
      );
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted select-none">← Back to Library</button>
        {submitted && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Score: <span className="text-primary">{score} / {questions.length}</span></span>
            <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 select-none">🔄 Try Again</button>
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{exercise.title}</h2>
      {exercise.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exercise.topic}{exercise.subtopic && exercise.subtopic !== 'General' ? ` › ${exercise.subtopic}` : ''}</span>}

      {/* Passage */}
      <div className="mt-5 bg-card rounded-2xl border border-border p-6 text-lg leading-loose mb-6">
        {renderPassage()}
      </div>

      {/* Question list */}
      <div className="space-y-4 mb-6">
        {questions.map((q, qi) => {
          const opts = shuffledOptions[qi] || q.options;
          const userAns = answers[q.blank_id];
          const isCorrect = submitted && userAns === q.correct;
          return (
            <div key={qi} className={`bg-card rounded-2xl border p-5 ${submitted ? (isCorrect ? 'border-green-300' : 'border-red-300') : 'border-border'}`}>
              <p className="text-sm font-semibold text-foreground mb-3">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-lg mr-2">{q.blank_id}</span>
                Choose the best answer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {opts.map((opt, oi) => {
                  const letter = ['A', 'B', 'C', 'D'][oi];
                  const selected = userAns === opt;
                  const isThisCorrect = submitted && opt === q.correct;
                  const isThisWrong = submitted && selected && !isThisCorrect;
                  return (
                    <button key={oi} disabled={submitted}
                      onClick={() => setAnswers(a => ({ ...a, [q.blank_id]: opt }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all select-none
                        ${isThisCorrect ? 'bg-green-100 border-green-400 text-green-800' :
                          isThisWrong ? 'bg-red-100 border-red-400 text-red-700' :
                          selected ? 'bg-primary/10 border-primary text-primary' :
                          'bg-background border-border text-foreground hover:bg-muted'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isThisCorrect ? 'bg-green-500 text-white' :
                          isThisWrong ? 'bg-red-500 text-white' :
                          selected ? 'bg-primary text-primary-foreground' :
                          'bg-muted text-muted-foreground'}`}>{letter}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && !isCorrect && (
                <p className="mt-3 text-xs text-green-700 font-medium">✅ Correct answer: <strong>{q.correct}</strong>{q.explanation ? ` — ${q.explanation}` : ''}</p>
              )}
              {submitted && isCorrect && q.explanation && (
                <p className="mt-3 text-xs text-green-700">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="text-center">
          <button onClick={() => { if (Object.keys(answers).length < questions.length && !confirm("Haven't answered all. Submit anyway?")) return; setSubmitted(true); }}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm select-none">
            ✅ Submit Answers
          </button>
        </div>
      )}
    </div>
  );
}

function ClozeReadView({ exercise, isEditor, onBack, onSaveAnnotation }) {
  const { passageContent, bankText } = splitContentAndBank(exercise.content || '');
  const tokens = parseClozeTokens(passageContent);
  const blankCount = tokens.filter(t => t.type === 'blank').length;
  const [answers, setAnswers] = useState(Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [showRuby, setShowRuby] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const annotations = exercise.annotations || {};
  const [wordBank] = useState(() => {
    const bank = buildWordBank(tokens, bankText);
    return [...bank].sort(() => 0.5 - Math.random());
  });
  const speak = (text) => { window.speechSynthesis?.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; window.speechSynthesis?.speak(u); };
  const handleWordClick = (word) => { speak(word); if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word); };
  const handleTextSelect = useCallback(() => {
    if (!isEditor) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0 && sel.length < 35 && !sel.includes('\n')) {
      setTimeout(() => {
        const meaning = prompt(`Add annotation for "${sel}":\n(Leave blank to remove)`);
        if (meaning !== null) { onSaveAnnotation(exercise.id, sel, meaning.trim()); window.getSelection()?.removeAllRanges(); }
      }, 50);
    }
  }, [isEditor, exercise.id, onSaveAnnotation]);
  const posClass = (m) => { const t = (m || '').toLowerCase(); if (/^n\./.test(t)) return 'border-l-4 border-blue-400 bg-blue-50'; if (/^v\./.test(t)) return 'border-l-4 border-red-400 bg-red-50'; if (/^adj\./.test(t)) return 'border-l-4 border-emerald-400 bg-emerald-50'; if (/^adv\./.test(t)) return 'border-l-4 border-amber-400 bg-amber-50'; return 'border-l-4 border-border bg-muted/40'; };

  const [showPrintOptions, setShowPrintOptions] = useState(false);

  const handlePrint = (withAnswers) => {
    setShowPrintOptions(false);
    const correctAnswers = tokens.filter(t => t.type === 'blank').map(t => t.correct);
    const bank = buildWordBank(tokens, bankText);
    let blankIdx = 0;
    const passageHtml = tokens.map(token => {
      if (token.type === 'text') return token.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br/>');
      const idx = blankIdx++;
      const answer = correctAnswers[idx];
      if (withAnswers) return `<span style="display:inline-block;min-width:80px;border-bottom:2px solid #7c3aed;text-align:center;font-weight:700;color:#7c3aed;padding:0 4px;">${answer}</span>`;
      return `<span style="display:inline-block;min-width:80px;border-bottom:2px solid #333;padding:0 8px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
    }).join('');
    const wordBankHtml = exercise.hasOptions === 'bank' && bank.length > 0
      ? `<div style="border:1.5px dashed #93c5fd;border-radius:10px;padding:12px 16px;margin-bottom:18px;background:#eff6ff;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <strong style="color:#1e40af;font-size:10pt;display:block;margin-bottom:8px;">Word Bank:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">${bank.map(w => `<span style="background:#fff;border:1px solid #bfdbfe;padding:3px 12px;border-radius:20px;font-size:10pt;">${w}</span>`).join('')}</div>
        </div>` : '';
    const annotHtml = Object.keys(annotations).length > 0 && withAnswers
      ? `<div style="margin-top:18px;border-top:1px solid #e5e7eb;padding-top:14px;">
          <strong style="font-size:10pt;color:#374151;display:block;margin-bottom:8px;">Vocabulary Notes:</strong>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">${Object.entries(annotations).map(([w, m]) => `<div style="font-size:9pt;"><strong style="color:#7c3aed;">${w}</strong> — ${m}</div>`).join('')}</div>
        </div>` : '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${exercise.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; font-size: 12pt; color: #111; padding: 20mm 20mm 15mm; }
      h1 { font-size: 16pt; font-weight: 700; margin-bottom: 4px; }
      .meta { font-size: 9pt; color: #666; margin-bottom: 14px; }
      .passage { font-size: 12pt; line-height: 2.4; }
      @media print { body { padding: 15mm 18mm 12mm; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    </style></head><body>
    <h1>${exercise.title}</h1>
    <div class="meta">${[exercise.topic, exercise.subtopic && exercise.subtopic !== 'General' ? exercise.subtopic : ''].filter(Boolean).join(' › ')}${withAnswers ? ' — Answer Key' : ''}</div>
    ${wordBankHtml}
    <div class="passage">${passageHtml}</div>
    ${annotHtml}
    <script>window.onload=()=>{ setTimeout(()=>{ window.print(); }, 600); }<\/script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted select-none">← Back to Library</button>
        <div className="flex flex-wrap gap-2">
          {Object.keys(annotations).length > 0 && <>
            <button onClick={() => setShowRuby(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border select-none ${showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>📖 {showRuby ? 'Hide' : 'Show'} Ruby</button>
            <button onClick={() => setShowMargin(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border select-none ${showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}
          <div className="relative">
            <button onClick={() => setShowPrintOptions(v => !v)} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium select-none">🖨️ Print</button>
            {showPrintOptions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPrintOptions(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden w-48">
                  <button onClick={() => handlePrint(false)} className="w-full text-left px-4 py-3 text-sm hover:bg-muted border-b border-border select-none">📄 Without Answers</button>
                  <button onClick={() => handlePrint(true)} className="w-full text-left px-4 py-3 text-sm hover:bg-muted select-none">✅ With Answers</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{exercise.title}</h2>
        {exercise.topic && <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{exercise.topic}{exercise.subtopic && exercise.subtopic !== 'General' ? ` › ${exercise.subtopic}` : ''}</span>}
      </div>
      {isEditor && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm"><strong>Editor Mode:</strong> Highlight any word to add/remove an annotation.</div>}
      {exercise.hasOptions === 'bank' && wordBank.length > 0 && !submitted && (
        <div className="bg-sky-50 border border-dashed border-sky-300 rounded-xl p-4 mb-5 text-center">
          <strong className="text-sky-700 text-sm block mb-2">Word Bank:</strong>
          <div className="flex flex-wrap gap-2 justify-center">{wordBank.map(w => <span key={w} className="bg-white border border-sky-200 text-foreground px-3 py-1 rounded-full text-sm shadow-sm">{w}</span>)}</div>
        </div>
      )}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 lg:p-8 text-lg leading-loose" onMouseUp={handleTextSelect}>
          <ClozeContent tokens={tokens} hasOptions={exercise.hasOptions} answers={answers} setAnswers={setAnswers} submitted={submitted} annotations={annotations} showRuby={showRuby} activeWord={activeWord} onWordClick={handleWordClick} explicitBankText={bankText} />
        </div>
        {showMargin && Object.keys(annotations).length > 0 && (
          <aside className="w-40 shrink-0 flex flex-col gap-2.5 pt-1">
            {Object.entries(annotations).map(([word, meaning]) => (
              <div key={word} onMouseEnter={() => setActiveWord(word)} onMouseLeave={() => setActiveWord(null)}
                className={`rounded-lg px-3 py-2 text-[11px] leading-snug cursor-pointer ${posClass(meaning)} ${activeWord === word ? 'shadow-md -translate-x-0.5' : ''}`}>
                <strong className="block text-[12px] text-primary mb-0.5">{word}</strong>{meaning}
              </div>
            ))}
          </aside>
        )}
      </div>
      {!submitted
        ? <div className="mt-5 text-center"><button onClick={() => { if (answers.every(a => a.trim()) || confirm("Haven't answered all. Submit anyway?")) setSubmitted(true); }} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm select-none">✅ Submit Answers</button></div>
        : <div className="mt-5 text-center"><button onClick={() => { setAnswers(Array(blankCount).fill('')); setSubmitted(false); }} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 text-sm select-none">🔄 Try Again</button></div>
      }
      {activeWord && !showMargin && !showRuby && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl z-50 max-w-xs text-center pointer-events-none">
          <strong className="block text-primary">{activeWord}</strong>{annotations[activeWord]}
        </div>
      )}
    </div>
  );
}

function BulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); onImport(Array.isArray(data) ? data : [data]); } catch { alert('Invalid JSON file.'); } };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Cloze Exercises</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file with an array of cloze exercise objects. Each needs <code className="bg-muted px-1 rounded">title</code> and <code className="bg-muted px-1 rounded">content</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border select-none">Cancel</button>
      </div>
    </div>
  );
}

export default function ClozeModule({ isEditor }) {
  const navigate = useNavigate();
  const { exercises, loading, reload } = useClozeExercises(isEditor);

  const saveExercise = async (data) => {
    const payload = { title: data.title, topic: data.topic, subtopic: data.subtopic, has_options: data.hasOptions || 'bank', content: data.content, annotations: data.annotations || {}, status: data.status || 'published', is_published: data.status !== 'draft', mc_questions: data.mc_questions || [] };
    if (data.id) await contentApi.update('ClozeExercise', data.id, payload);
    else await contentApi.create('ClozeExercise', payload);
    navigate('/cloze');
  };

  const handleSaveAnnotation = async (exId, word, meaning) => {
    const ex = await base44.entities.ClozeExercise.get(exId);
    const annotations = { ...(ex.annotations || {}) };
    if (!meaning) delete annotations[word]; else annotations[word] = meaning;
    await contentApi.update('ClozeExercise', exId, { annotations });
    reload();
  };

  return (
    <Routes>
      <Route path="/cloze" element={
        loading
          ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
          : <ClozeLibrary exercises={exercises} isEditor={isEditor} refreshing={false}
              onView={p => navigate(`/cloze/read/${p.id}`)}
              onEdit={p => navigate(p ? `/cloze/edit/${p.id}` : '/cloze/edit/new')}
              onDelete={async id => { await contentApi.delete('ClozeExercise', id); reload(); }}
              onBulkImport={null}
            />
      } />
      <Route path="/cloze/read/:id" element={(() => {
        const W = () => {
          const [ex, setEx] = useState(null);
          const id = window.location.pathname.split('/').pop();
          useEffect(() => { base44.entities.ClozeExercise.get(id).then(e => setEx({ ...e, hasOptions: e.has_options || 'bank', annotations: e.annotations || {} })); }, [id]);
          if (!ex) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          if (ex.hasOptions === 'mccloze') return <MCClozeReadView exercise={ex} onBack={() => navigate('/cloze')} />;
          return <ClozeReadView exercise={ex} isEditor={isEditor} onBack={() => navigate('/cloze')} onSaveAnnotation={handleSaveAnnotation} />;
        };
        return <W />;
      })()} />
      <Route path="/cloze/edit/:id" element={(() => {
        const W = () => {
          const [ex, setEx] = useState(undefined);
          const idStr = window.location.pathname.split('/').pop();
          useEffect(() => {
            if (idStr === 'new') { setEx(null); return; }
            base44.entities.ClozeExercise.get(idStr).then(e => setEx({ ...e, hasOptions: e.has_options || 'bank', annotations: e.annotations || {}, mc_questions: e.mc_questions || [] }));
          }, [idStr]);
          if (ex === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <ClozeEditor exercise={ex} onSave={saveExercise} onCancel={() => navigate('/cloze')} />;
        };
        return <W />;
      })()} />
    </Routes>
  );
}