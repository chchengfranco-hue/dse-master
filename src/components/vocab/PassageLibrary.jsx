import { useState } from 'react';

export default function PassageLibrary({ passages, isEditor, onRead, onEdit, onDelete, onBulkImport }) {
  const [sel, setSel] = useState('All');
  const [selSub, setSelSub] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER = 10;

  const topicTree = {};
  passages.forEach(p => {
    const t = p.topic || 'Uncategorized', st = p.subtopic || 'General';
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st !== 'General') topicTree[t].add(st);
  });

  const filtered = passages.filter(p => {
    const tm = sel === 'All' || (selSub ? p.topic === sel && p.subtopic === selSub : p.topic === sel);
    const sm = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return tm && sm;
  });
  const totalPages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice((page - 1) * PER, page * PER);

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reading Library</h1>
          <p className="text-sm text-muted-foreground mt-1">HKDSE reading passages with annotations</p>
        </div>
        <div className="flex gap-2">
          {isEditor && onBulkImport && (
            <button onClick={onBulkImport} className="px-3 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border transition-colors select-none">📥 Import</button>
          )}
          {isEditor && (
            <button onClick={() => onEdit(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none">+ Add Passage</button>
          )}
        </div>
      </div>

      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search passages..." className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-5" />

      <div className="flex gap-5 items-start">
        <aside className="w-52 shrink-0 bg-card rounded-2xl border border-border p-4 hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Categories</h3>
          <button onClick={() => { setSel('All'); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors select-none ${sel === 'All' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>All Passages ({passages.length})</button>
          {Object.keys(topicTree).sort().map(t => (
            <div key={t}>
              <button onClick={() => { setSel(t); setSelSub(null); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors select-none ${sel === t && !selSub ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}>{t} ({passages.filter(p => p.topic === t).length})</button>
              {Array.from(topicTree[t]).sort().map(st => (
                <button key={st} onClick={() => { setSel(t); setSelSub(st); setPage(1); }} className={`w-full text-left px-3 py-1.5 pl-6 rounded-xl text-xs mb-0.5 transition-colors select-none ${sel === t && selSub === st ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{st} ({passages.filter(p => p.topic === t && p.subtopic === st).length})</button>
              ))}
            </div>
          ))}
        </aside>

        <div className="flex-1 min-w-0 space-y-3">
          {paged.length === 0 && <div className="text-center py-16 text-muted-foreground">No passages found.</div>}
          {paged.map(p => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.topic && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{p.topic}</span>}
                  {p.subtopic && p.subtopic !== 'General' && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium">{p.subtopic}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onRead(p)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors select-none">Read</button>
                {isEditor && <>
                  <button onClick={() => onEdit(p)} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors border border-border select-none">Edit</button>
                  <button onClick={() => onDelete(p.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200 select-none">Delete</button>
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