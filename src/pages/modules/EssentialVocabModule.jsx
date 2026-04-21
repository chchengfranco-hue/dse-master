import { useState } from 'react';
import { Plus, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const defaultWords = [
  { id: 1, word: 'proliferation', pos: 'n.', definition: 'rapid increase in the number or amount of something', example: 'The proliferation of smartphones has changed daily life.' },
  { id: 2, word: 'detrimental', pos: 'adj.', definition: 'tending to cause harm', example: 'Excessive screen time is detrimental to children\'s health.' },
  { id: 3, word: 'exacerbate', pos: 'v.', definition: 'make a problem, situation, or feeling worse', example: 'Cutting budgets will only exacerbate the issue.' },
  { id: 4, word: 'holistic', pos: 'adj.', definition: 'dealing with or treating the whole of something', example: 'We need a holistic approach to education reform.' },
  { id: 5, word: 'stringent', pos: 'adj.', definition: '(of regulations or requirements) strict, precise, and exacting', example: 'Stringent regulations are needed to protect the environment.' },
  { id: 6, word: 'alleviate', pos: 'v.', definition: 'make suffering, deficiency, or a problem less severe', example: 'Exercise can help alleviate stress.' },
];

const STORAGE_KEY = 'essentialVocab';
const load = () => { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultWords; };
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

export default function EssentialVocabModule({ isEditor }) {
  const [words, setWords] = useState(load);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ word: '', pos: '', definition: '', example: '' });
  const [flipped, setFlipped] = useState({});

  const update = (d) => { setWords(d); save(d); };

  const addWord = () => {
    if (!form.word.trim() || !form.definition.trim()) return;
    update([...words, { id: Date.now(), ...form }]);
    setForm({ word: '', pos: '', definition: '', example: '' });
    setAdding(false);
  };

  const deleteWord = (id) => update(words.filter(w => w.id !== id));
  const toggleFlip = (id) => setFlipped(p => ({ ...p, [id]: !p[id] }));

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="📚" title="Essential Vocabulary" description="Master high-frequency HKDSE vocabulary with definitions and example sentences." />

      <div className="flex gap-2 mb-6">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search words..." className="flex-1" />
        {isEditor && <Button onClick={() => setAdding(!adding)}><Plus className="w-4 h-4 mr-1" />Add</Button>}
      </div>

      {isEditor && adding && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 space-y-3">
          <Input placeholder="Word..." value={form.word} onChange={e => setForm(p => ({ ...p, word: e.target.value }))} />
          <Input placeholder="Part of speech (e.g. n., v., adj.)..." value={form.pos} onChange={e => setForm(p => ({ ...p, pos: e.target.value }))} />
          <Input placeholder="Definition..." value={form.definition} onChange={e => setForm(p => ({ ...p, definition: e.target.value }))} />
          <Input placeholder="Example sentence..." value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={addWord}>Save</Button>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(w => (
          <div
            key={w.id}
            onClick={() => toggleFlip(w.id)}
            className="bg-card rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-32 relative group"
          >
            {!flipped[w.id] ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{w.word}</h3>
                    {w.pos && <span className="text-xs text-primary font-medium">{w.pos}</span>}
                  </div>
                  {isEditor && (
                    <button onClick={e => { e.stopPropagation(); deleteWord(w.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Tap to see definition →</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{w.definition}</p>
                {w.example && (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">"{w.example}"</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No words found.</p>
        </div>
      )}
    </div>
  );
}