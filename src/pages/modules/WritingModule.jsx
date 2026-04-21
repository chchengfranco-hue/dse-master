import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const defaultSamples = [
  {
    id: 1,
    title: 'Formal Email – Complaint Letter',
    type: 'Email',
    content: `Dear Sir/Madam,\n\nI am writing to express my concern regarding the recent changes to the school library opening hours. As a student who relies heavily on the library for self-study after school, I find the new schedule highly inconvenient.\n\nFirstly, the library now closes at 5 p.m., which leaves little time for students who have extra-curricular activities in the afternoon. Secondly, the reduction in weekend hours has further limited our access to study resources.\n\nI would strongly urge the school administration to reconsider this decision and restore the original opening hours. I believe this would greatly benefit the student body.\n\nYours faithfully,\nA Concerned Student`,
  },
  {
    id: 2,
    title: 'Argumentative Essay – Social Media',
    type: 'Essay',
    content: `In today's digital age, social media has become an integral part of our daily lives. While critics argue that it promotes superficial connections and spreads misinformation, I firmly believe that the benefits of social media far outweigh its drawbacks.\n\nTo begin with, social media platforms serve as powerful tools for communication. Families and friends separated by geographical boundaries can maintain close relationships through instant messaging and video calls. Moreover, social media has democratised the spread of information, allowing individuals to voice their opinions and raise awareness about important social issues.\n\nIn conclusion, when used responsibly, social media is a force for good in modern society.`,
  },
];

const STORAGE_KEY = 'writingSamples';
const load = () => { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultSamples; };
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

export default function WritingModule({ isEditor }) {
  const [samples, setSamples] = useState(load);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', content: '' });

  const update = (d) => { setSamples(d); save(d); };

  const addSample = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    update([...samples, { id: Date.now(), ...form }]);
    setForm({ title: '', type: '', content: '' });
    setAdding(false);
  };

  const deleteSample = (id) => {
    update(samples.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  if (selected) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          ← Back to samples
        </button>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selected.type}</span>
              <h2 className="text-lg font-bold text-foreground mt-2">{selected.title}</h2>
            </div>
            {isEditor && (
              <Button variant="destructive" size="sm" onClick={() => deleteSample(selected.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="bg-muted/50 rounded-xl p-5">
            <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">{selected.content}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="✍️" title="Sample Writing" description="Study annotated model answers for HKDSE writing tasks." />

      {isEditor && (
        <div className="mb-6">
          {!adding ? (
            <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Sample</Button>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <Input placeholder="Title..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <Input placeholder="Type (e.g. Email, Essay)..." value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
              <textarea
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-40 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Writing content..."
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button onClick={addSample}>Save</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {samples.map(sample => (
          <div key={sample.id}
            className="bg-card rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => setSelected(sample)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{sample.type}</span>
                <h3 className="font-semibold text-foreground mt-2 text-sm">{sample.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sample.content}</p>
              </div>
              <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}