import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ExternalLink, Plus, Edit, Trash2, Sparkles, Globe, RefreshCw } from 'lucide-react';

const TOPIC_COLORS = {
  Politics: 'bg-red-100 text-red-700',
  Technology: 'bg-blue-100 text-blue-700',
  Environment: 'bg-green-100 text-green-700',
  Economy: 'bg-amber-100 text-amber-700',
  Society: 'bg-purple-100 text-purple-700',
  Science: 'bg-cyan-100 text-cyan-700',
  Health: 'bg-rose-100 text-rose-700',
  Culture: 'bg-orange-100 text-orange-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Security: 'bg-slate-100 text-slate-700',
};

function useHotIssues(isEditor) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.HotIssue.list('-created_date', 100);
    const filtered = isEditor ? data : data.filter(i => i.status === 'published');
    setIssues(filtered);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { issues, loading, reload: load };
}

// --- Issue Card ---
function IssueCard({ issue, isEditor, onEdit, onDelete }) {
  const topicColor = TOPIC_COLORS[issue.topic] || 'bg-muted text-muted-foreground';
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            {issue.topic && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${topicColor}`}>
                {issue.topic}
              </span>
            )}
            {issue.subtopic && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">
                {issue.subtopic}
              </span>
            )}
            {issue.ai_generated && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
            {isEditor && issue.status === 'draft' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">🔒 Draft</span>
            )}
          </div>
          <h3 className="font-bold text-foreground text-base leading-snug mb-2">{issue.headline}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{issue.summary}</p>
          {issue.source_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              {issue.source_link ? (
                <a href={issue.source_link} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium">
                  {issue.source_name} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="font-medium">{issue.source_name}</span>
              )}
            </div>
          )}
        </div>
        {isEditor && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={() => onEdit(issue)} className="p-1.5 bg-muted hover:bg-border rounded-lg transition-colors">
              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => { if (confirm('Delete this issue?')) onDelete(issue.id); }}
              className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Editor Form ---
function IssueEditor({ issue, onSave, onCancel }) {
  const [form, setForm] = useState({
    headline: issue?.headline || '',
    summary: issue?.summary || '',
    source_name: issue?.source_name || '',
    source_link: issue?.source_link || '',
    topic: issue?.topic || '',
    subtopic: issue?.subtopic || '',
    status: issue?.status || 'published',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.headline.trim() || !form.summary.trim()) return alert('Headline and Summary are required.');
    onSave({ ...form, id: issue?.id });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{issue?.id ? 'Edit Issue' : 'Add New Issue'}</h2>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Headline <span className="text-destructive">*</span></label>
            <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. Global Leaders Meet to Discuss AI Regulation" value={form.headline} onChange={e => s('headline', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Summary <span className="text-destructive">*</span></label>
            <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-24 resize-y" placeholder="2-4 sentence summary..." value={form.summary} onChange={e => s('summary', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Topic</label>
              <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.topic} onChange={e => s('topic', e.target.value)}>
                <option value="">— Select Topic —</option>
                {Object.keys(TOPIC_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Sub-topic</label>
              <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. Climate Change" value={form.subtopic} onChange={e => s('subtopic', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Source Name</label>
              <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. BBC News" value={form.source_name} onChange={e => s('source_name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Source Link</label>
              <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="https://..." value={form.source_link} onChange={e => s('source_link', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
            <span className="text-sm font-medium text-foreground">Status:</span>
            <button onClick={() => s('status', 'draft')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'draft' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>🔒 Draft</button>
            <button onClick={() => s('status', 'published')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'published' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>✅ Published</button>
          </div>
        </div>
        <div className="p-5 border-t border-border flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-border border border-border">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90">Save Issue</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Library ---
function HotIssuesLibrary({ issues, loading, isEditor, onEdit, onDelete, onReload }) {
  const [filterTopic, setFilterTopic] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [editingIssue, setEditingIssue] = useState(undefined); // undefined = closed, null = new

  const topics = ['All', ...Object.keys(TOPIC_COLORS)];
  const filtered = filterTopic === 'All' ? issues : issues.filter(i => i.topic === filterTopic);

  const handleGenerateAI = async () => {
    if (!confirm('Generate 10 new AI hot issues? This will replace all existing AI-generated issues.')) return;
    setGenerating(true);
    await base44.functions.invoke('generateHotIssues', {});
    await onReload();
    setGenerating(false);
  };

  const handleSave = async (data) => {
    if (data.id) {
      await base44.entities.HotIssue.update(data.id, { ...data, ai_generated: false });
    } else {
      await base44.entities.HotIssue.create({ ...data, ai_generated: false });
    }
    setEditingIssue(undefined);
    onReload();
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🌍 Global Hot Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Latest trending issues around the world</p>
        </div>
        {isEditor && (
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <button onClick={handleGenerateAI} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 select-none">
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating…' : 'AI Generate'}
            </button>
            <button onClick={() => setEditingIssue(null)}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border transition-colors select-none">
              <Plus className="w-4 h-4" /> Add Issue
            </button>
          </div>
        )}
      </div>

      {/* Topic filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {topics.map(t => (
          <button key={t} onClick={() => setFilterTopic(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterTopic === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-border'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No issues found.</p>
          {isEditor && <p className="text-sm mt-1">Try generating AI issues or adding one manually.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(issue => (
            <IssueCard key={issue.id} issue={issue} isEditor={isEditor}
              onEdit={() => setEditingIssue(issue)}
              onDelete={async id => { await base44.entities.HotIssue.delete(id); onReload(); }}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editingIssue !== undefined && (
        <IssueEditor
          issue={editingIssue}
          onSave={handleSave}
          onCancel={() => setEditingIssue(undefined)}
        />
      )}
    </div>
  );
}

// --- Module Entry ---
export default function HotIssuesModule({ isEditor }) {
  const { issues, loading, reload } = useHotIssues(isEditor);
  return (
    <HotIssuesLibrary
      issues={issues}
      loading={loading}
      isEditor={isEditor}
      onReload={reload}
    />
  );
}