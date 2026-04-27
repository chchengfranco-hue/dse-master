import { useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';

const GENRE_COLORS = [
  'from-purple-500 to-purple-700',
  'from-blue-500 to-blue-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-emerald-500 to-emerald-700',
  'from-cyan-500 to-cyan-700',
  'from-orange-500 to-orange-700',
  'from-indigo-500 to-indigo-700',
  'from-pink-500 to-pink-700',
  'from-teal-500 to-teal-700',
];

const FORMALITY_LABEL = {
  'informal': { label: 'Informal', cls: 'bg-green-100 text-green-700' },
  'semi-formal': { label: 'Semi-formal', cls: 'bg-blue-100 text-blue-700' },
  'semi-formal to informal': { label: 'Semi-formal', cls: 'bg-blue-100 text-blue-700' },
  'formal': { label: 'Formal', cls: 'bg-purple-100 text-purple-700' },
  'formal to semi-formal': { label: 'Formal', cls: 'bg-purple-100 text-purple-700' },
};

function formalityBadge(f) {
  const key = (f || '').toLowerCase();
  return FORMALITY_LABEL[key] || { label: f || '', cls: 'bg-muted text-muted-foreground' };
}

export default function GenreTemplateLibrary({ templates, isEditor, onView, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = templates.filter(t => !search || t.genre?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Writing Genre Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Learn the structure, features and language for each writing genre</p>
        </div>
        {isEditor && (
          <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 select-none">
            <Plus className="w-4 h-4" /> Add Template
          </button>
        )}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search genres..."
        className="w-full rounded-xl border border-input px-3 py-2 text-sm mb-6"
      />

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No genre templates yet.</p>
          {isEditor && <p className="text-sm mt-1">Click "Add Template" to get started.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, idx) => {
          const gradient = GENRE_COLORS[idx % GENRE_COLORS.length];
          const badge = formalityBadge(t.formality);
          return (
            <div key={t.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all group">
              {/* Colour header */}
              <div className={`h-2 bg-gradient-to-r ${gradient}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  {isEditor && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete this template?')) onDelete(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-foreground text-base mb-1">{t.genre}</h3>
                {t.tone && <p className="text-xs text-muted-foreground mb-2 capitalize">{t.tone}</p>}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {t.formality && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
                  {t.structure?.length > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t.structure.length} sections</span>}
                  {t.language_resources?.length > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t.language_resources.length} phrase categories</span>}
                </div>
                <button
                  onClick={() => onView(t)}
                  className="w-full py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors select-none"
                >
                  View Template
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}