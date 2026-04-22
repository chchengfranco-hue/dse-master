import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TOPIC_TREE } from '@/lib/topicTree';

export default function PassageEditor({ passage, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: passage?.id || null,
    title: passage?.title || '',
    topic: passage?.topic || '',
    subtopic: passage?.subtopic || '',
    imageUrl: passage?.imageUrl || '',
    content: passage?.content || '',
    annotationsText: passage?.annotations
      ? Object.entries(passage.annotations).map(([k, v]) => `${k}: ${v}`).join('\n')
      : '',
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleTopicChange = (e) => {
    setForm(p => ({ ...p, topic: e.target.value, subtopic: '' }));
  };

  const subtopics = form.topic && TOPIC_TREE[form.topic] ? TOPIC_TREE[form.topic] : [];

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return alert('Title and Content are required.');
    const annotations = {};
    form.annotationsText.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const word = line.substring(0, idx).trim();
        const meaning = line.substring(idx + 1).trim();
        if (word && meaning) annotations[word] = meaning;
      }
    });
    onSave({ id: form.id, title: form.title.trim(), topic: form.topic || 'Uncategorized', subtopic: form.subtopic || 'General', imageUrl: form.imageUrl.trim(), content: form.content.trim(), annotations });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-5">{form.id ? 'Edit Passage' : 'Add Passage'}</h2>

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
            onChange={e => set('subtopic', e.target.value)}
            disabled={!form.topic}
          >
            <option value="">— Select Sub-topic —</option>
            {subtopics.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <Input className="mb-3" placeholder="Passage Title" value={form.title} onChange={e => set('title', e.target.value)} />
        <Input className="mb-3" placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} />

        <textarea
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-48 resize-y mb-3 font-inherit"
          placeholder="Paste passage content here..."
          value={form.content}
          onChange={e => set('content', e.target.value)}
        />

        <p className="text-xs text-muted-foreground mb-2">
          <strong>Annotations</strong> — one per line, format: <code className="bg-muted px-1 rounded">word: definition</code>
          <br />Start definitions with <code className="bg-muted px-1 rounded">n.</code>, <code className="bg-muted px-1 rounded">v.</code>, <code className="bg-muted px-1 rounded">adj.</code> or <code className="bg-muted px-1 rounded">adv.</code> for colour-coded margin notes.
        </p>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-28 resize-y mb-5 font-inherit"
          placeholder={"proliferation: n. rapid increase in number\nexacerbate: v. to make a problem worse"}
          value={form.annotationsText}
          onChange={e => set('annotationsText', e.target.value)}
        />

        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Passage</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}