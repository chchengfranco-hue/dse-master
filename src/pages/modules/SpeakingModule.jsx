import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const defaultTopics = [
  {
    id: 1,
    topic: 'Social Media',
    type: 'Individual',
    points: [
      'Connects people across the globe',
      'Can spread misinformation rapidly',
      'May lead to cyberbullying and mental health issues',
      'Provides a platform for self-expression',
    ],
    questions: [
      'Should teenagers be restricted from using social media?',
      'Do the benefits of social media outweigh its drawbacks?',
    ],
  },
  {
    id: 2,
    topic: 'Environmental Protection',
    type: 'Group Discussion',
    points: [
      'Government should enforce stricter regulations',
      'Individuals can reduce carbon footprint',
      'Businesses have a responsibility to go green',
      'Education raises environmental awareness',
    ],
    questions: [
      'What is the most effective way to tackle climate change?',
      'Should plastic be banned entirely?',
    ],
  },
  {
    id: 3,
    topic: 'Technology in Education',
    type: 'Individual',
    points: [
      'Makes learning more interactive and engaging',
      'Provides access to vast online resources',
      'Risk of distraction and over-reliance',
      'Widens the digital divide',
    ],
    questions: [
      'Has technology improved the quality of education?',
      'Should smartphones be allowed in classrooms?',
    ],
  },
];

const STORAGE_KEY = 'speakingTopics';
const load = () => { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultTopics; };
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

export default function SpeakingModule({ isEditor }) {
  const [topics, setTopics] = useState(load);
  const [expanded, setExpanded] = useState({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ topic: '', type: 'Individual', points: '', questions: '' });

  const update = (d) => { setTopics(d); save(d); };

  const addTopic = () => {
    if (!form.topic.trim()) return;
    update([...topics, {
      id: Date.now(),
      topic: form.topic.trim(),
      type: form.type,
      points: form.points.split('\n').filter(p => p.trim()),
      questions: form.questions.split('\n').filter(q => q.trim()),
    }]);
    setForm({ topic: '', type: 'Individual', points: '', questions: '' });
    setAdding(false);
  };

  const deleteTopic = (id) => update(topics.filter(t => t.id !== id));
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const typeColors = { 'Individual': 'bg-primary/10 text-primary', 'Group Discussion': 'bg-amber-100 text-amber-700' };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="🎤" title="Speaking Practice" description="Prepare key talking points and questions for HKDSE speaking tasks." />

      {isEditor && (
        <div className="mb-6">
          {!adding ? (
            <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" />Add Topic</Button>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <Input placeholder="Topic..." value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
              <select className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option>Individual</option>
                <option>Group Discussion</option>
              </select>
              <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-28 resize-y" placeholder="Key points (one per line)..." value={form.points} onChange={e => setForm(p => ({ ...p, points: e.target.value }))} />
              <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-20 resize-y" placeholder="Discussion questions (one per line)..." value={form.questions} onChange={e => setForm(p => ({ ...p, questions: e.target.value }))} />
              <div className="flex gap-2">
                <Button onClick={addTopic}>Save</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <button onClick={() => toggle(topic.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎤</span>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-sm">{topic.topic}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[topic.type] || 'bg-muted text-muted-foreground'}`}>{topic.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditor && (
                  <span onClick={e => { e.stopPropagation(); deleteTopic(topic.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </span>
                )}
                {expanded[topic.id] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {expanded[topic.id] && (
              <div className="px-5 pb-5 border-t border-border">
                {topic.points?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Key Points</p>
                    <ul className="space-y-2">
                      {topic.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {topic.questions?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Discussion Questions</p>
                    <ul className="space-y-2">
                      {topic.questions.map((q, i) => (
                        <li key={i} className="bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground">❓ {q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}