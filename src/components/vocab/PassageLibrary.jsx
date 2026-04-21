import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PassageLibrary({ passages, isEditor, onRead, onEdit, onDelete }) {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Build topic tree
  const topicTree = {};
  passages.forEach(p => {
    const t = p.topic || 'Uncategorized';
    const st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });

  const filter = (t, st) => { setSelectedTopic(t); setSelectedSubtopic(st); setPage(1); };

  const filtered = passages.filter(p => {
    const topicMatch = selectedTopic === 'All' ||
      (selectedSubtopic
        ? p.topic === selectedTopic && p.subtopic === selectedSubtopic
        : p.topic === selectedTopic);
    const searchMatch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.topic || '').toLowerCase().includes(search.toLowerCase());
    return topicMatch && searchMatch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reading Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Annotated passages for vocabulary learning</p>
        </div>
        {isEditor && (
          <Button onClick={() => onEdit(null)}><Plus className="w-4 h-4 mr-1" />Add Passage</Button>
        )}
      </div>

      <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search passages..." className="mb-5" />

      <div className="flex gap-5 items-start">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button
            onClick={() => filter('All', null)}
            className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors",
              selectedTopic === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground')}
          >
            All Passages ({passages.length})
          </button>
          {Object.keys(topicTree).sort().map(topic => (
            <div key={topic}>
              <button
                onClick={() => filter(topic, null)}
                className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors",
                  selectedTopic === topic && !selectedSubtopic ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground')}
              >
                {topic} ({passages.filter(p => p.topic === topic).length})
              </button>
              {Array.from(topicTree[topic]).sort().map(st => (
                <button
                  key={st}
                  onClick={() => filter(topic, st)}
                  className={cn("w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors",
                    selectedTopic === topic && selectedSubtopic === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
                >
                  {st} ({passages.filter(p => p.topic === topic && p.subtopic === st).length})
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* List */}
        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No passages found.</div>
          )}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}{p.subtopic && p.subtopic !== 'General' ? ` › ${p.subtopic}` : ''}</span>}
                  {p.annotations && Object.keys(p.annotations).length > 0 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">{Object.keys(p.annotations).length} words</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => onRead(p)}>Read</Button>
                {isEditor && <>
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}>Delete</Button>
                </>}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}