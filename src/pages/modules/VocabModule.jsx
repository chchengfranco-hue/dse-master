import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const defaultTopics = [
  {
    id: 1,
    topic: 'Environment',
    ideas: [
      { en: 'Climate change threatens biodiversity.', zh: '氣候變化威脅生物多樣性。' },
      { en: 'Renewable energy reduces carbon emissions.', zh: '可再生能源減少碳排放。' },
      { en: 'Pollution harms human health.', zh: '污染損害人類健康。' },
    ],
  },
  {
    id: 2,
    topic: 'Technology',
    ideas: [
      { en: 'Social media connects people globally.', zh: '社交媒體將全球人連繫起來。' },
      { en: 'Artificial intelligence transforms industries.', zh: '人工智能改變各行各業。' },
    ],
  },
  {
    id: 3,
    topic: 'Education',
    ideas: [
      { en: 'Critical thinking prepares students for the future.', zh: '批判性思維讓學生為未來做好準備。' },
      { en: 'Equal access to education reduces inequality.', zh: '平等受教育機會減少不平等。' },
    ],
  },
];

const STORAGE_KEY = 'vocabTopics';

const load = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : defaultTopics;
};

const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export default function VocabModule({ isEditor }) {
  const [topics, setTopics] = useState(load);
  const [expanded, setExpanded] = useState({});
  const [newTopic, setNewTopic] = useState('');
  const [newIdeas, setNewIdeas] = useState({});

  const update = (data) => { setTopics(data); save(data); };

  const addTopic = () => {
    if (!newTopic.trim()) return;
    const updated = [...topics, { id: Date.now(), topic: newTopic.trim(), ideas: [] }];
    update(updated);
    setNewTopic('');
  };

  const deleteTopic = (id) => update(topics.filter(t => t.id !== id));

  const addIdea = (topicId) => {
    const idea = newIdeas[topicId] || { en: '', zh: '' };
    if (!idea.en.trim()) return;
    const updated = topics.map(t =>
      t.id === topicId ? { ...t, ideas: [...t.ideas, { en: idea.en.trim(), zh: idea.zh.trim() }] } : t
    );
    update(updated);
    setNewIdeas(prev => ({ ...prev, [topicId]: { en: '', zh: '' } }));
  };

  const deleteIdea = (topicId, idx) => {
    const updated = topics.map(t =>
      t.id === topicId ? { ...t, ideas: t.ideas.filter((_, i) => i !== idx) } : t
    );
    update(updated);
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="💡" title="Thematic Idea Bank" description="Browse and study key ideas organized by topic for your HKDSE writing." />

      {isEditor && (
        <div className="flex gap-2 mb-6">
          <Input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="New topic name..." className="flex-1" />
          <Button onClick={addTopic}><Plus className="w-4 h-4 mr-1" />Add Topic</Button>
        </div>
      )}

      <div className="space-y-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(topic.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                  {topic.topic.charAt(0)}
                </div>
                <span className="font-semibold text-foreground">{topic.topic}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{topic.ideas.length} ideas</span>
              </div>
              <div className="flex items-center gap-2">
                {isEditor && (
                  <span onClick={e => { e.stopPropagation(); deleteTopic(topic.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </span>
                )}
                {expanded[topic.id] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {expanded[topic.id] && (
              <div className="px-5 pb-4 border-t border-border">
                <div className="space-y-3 mt-4">
                  {topic.ideas.map((idea, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-xl p-4 group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{idea.en}</p>
                          {idea.zh && <p className="text-xs text-muted-foreground mt-1">{idea.zh}</p>}
                        </div>
                        {isEditor && (
                          <button onClick={() => deleteIdea(topic.id, idx)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isEditor && (
                  <div className="mt-4 space-y-2">
                    <Input
                      placeholder="English idea..."
                      value={newIdeas[topic.id]?.en || ''}
                      onChange={e => setNewIdeas(prev => ({ ...prev, [topic.id]: { ...prev[topic.id], en: e.target.value } }))}
                    />
                    <Input
                      placeholder="Chinese translation (optional)..."
                      value={newIdeas[topic.id]?.zh || ''}
                      onChange={e => setNewIdeas(prev => ({ ...prev, [topic.id]: { ...prev[topic.id], zh: e.target.value } }))}
                    />
                    <Button size="sm" onClick={() => addIdea(topic.id)} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />Add Idea
                    </Button>
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