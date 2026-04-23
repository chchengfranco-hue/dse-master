import { useState } from 'react';
import { TOPIC_TREE as DEFAULT_TOPIC_TREE } from '@/lib/topicTree';
import { Plus, Trash2, ChevronDown, ChevronRight, RotateCcw, Check } from 'lucide-react';

const STORAGE_KEY = 'custom_topic_tree';

export function getTopicTree() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_TOPIC_TREE;
}

function saveTopicTree(tree) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}

export default function TopicEditor({ onClose }) {
  const [tree, setTree] = useState(() => {
    // Deep clone
    const src = getTopicTree();
    const out = {};
    Object.keys(src).forEach(k => { out[k] = [...src[k]]; });
    return out;
  });
  const [expanded, setExpanded] = useState({});
  const [newTopic, setNewTopic] = useState('');
  const [newSubtopic, setNewSubtopic] = useState({});
  const [saved, setSaved] = useState(false);

  const toggleExpand = (t) => setExpanded(p => ({ ...p, [t]: !p[t] }));

  const addTopic = () => {
    const t = newTopic.trim();
    if (!t || tree[t]) return;
    setTree(p => ({ ...p, [t]: [] }));
    setNewTopic('');
    setExpanded(p => ({ ...p, [t]: true }));
  };

  const deleteTopic = (t) => {
    if (!confirm(`Delete topic "${t}" and all its subtopics?`)) return;
    setTree(p => { const n = { ...p }; delete n[t]; return n; });
  };

  const renameTopic = (old, val) => {
    if (!val.trim() || val === old) return;
    setTree(p => {
      const n = {};
      Object.keys(p).forEach(k => { n[k === old ? val.trim() : k] = [...p[k]]; });
      return n;
    });
  };

  const addSubtopic = (topic) => {
    const st = (newSubtopic[topic] || '').trim();
    if (!st || tree[topic]?.includes(st)) return;
    setTree(p => ({ ...p, [topic]: [...(p[topic] || []), st] }));
    setNewSubtopic(p => ({ ...p, [topic]: '' }));
  };

  const deleteSubtopic = (topic, st) => {
    setTree(p => ({ ...p, [topic]: p[topic].filter(s => s !== st) }));
  };

  const renameSubtopic = (topic, old, val) => {
    if (!val.trim() || val === old) return;
    setTree(p => ({ ...p, [topic]: p[topic].map(s => s === old ? val.trim() : s) }));
  };

  const reset = () => {
    if (!confirm('Reset to default topics? This will discard all custom changes.')) return;
    localStorage.removeItem(STORAGE_KEY);
    const src = DEFAULT_TOPIC_TREE;
    const out = {};
    Object.keys(src).forEach(k => { out[k] = [...src[k]]; });
    setTree(out);
  };

  const handleSave = () => {
    saveTopicTree(tree);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onClose) onClose();
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Edit Topics & Sub-topics</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Changes are saved locally and shared across all modules</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-border transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            {onClose && <button onClick={onClose} className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-border transition-colors">Cancel</button>}
          </div>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {Object.keys(tree).map(topic => (
            <div key={topic} className="border border-border rounded-xl overflow-hidden">
              {/* Topic row */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40">
                <button onClick={() => toggleExpand(topic)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {expanded[topic] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <input
                  defaultValue={topic}
                  onBlur={e => renameTopic(topic, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                  className="flex-1 text-sm font-semibold bg-transparent border-none outline-none text-foreground min-w-0"
                />
                <span className="text-xs text-muted-foreground shrink-0">{tree[topic].length} sub</span>
                <button onClick={() => deleteTopic(topic)} className="text-red-400 hover:text-red-600 transition-colors p-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtopics */}
              {expanded[topic] && (
                <div className="bg-background border-t border-border px-3 py-2 space-y-1">
                  {tree[topic].map(st => (
                    <div key={st} className="flex items-center gap-2 pl-4">
                      <span className="text-muted-foreground text-xs">—</span>
                      <input
                        defaultValue={st}
                        onBlur={e => renameSubtopic(topic, st, e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                        className="flex-1 text-sm bg-transparent border-none outline-none text-foreground min-w-0 py-0.5"
                      />
                      <button onClick={() => deleteSubtopic(topic, st)} className="text-red-400 hover:text-red-600 transition-colors p-0.5 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add subtopic */}
                  <div className="flex gap-2 pl-4 pt-1">
                    <input
                      value={newSubtopic[topic] || ''}
                      onChange={e => setNewSubtopic(p => ({ ...p, [topic]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addSubtopic(topic)}
                      placeholder="New sub-topic…"
                      className="flex-1 text-xs border border-input rounded-lg px-2 py-1.5 bg-background min-w-0"
                    />
                    <button onClick={() => addSubtopic(topic)} className="px-2 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new topic */}
          <div className="flex gap-2 pt-2">
            <input
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="Add new main topic…"
              className="flex-1 text-sm border border-input rounded-xl px-3 py-2 bg-background"
            />
            <button onClick={addTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end">
          <button onClick={handleSave} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}