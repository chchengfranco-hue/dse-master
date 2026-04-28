import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const FORMALITY_OPTIONS = [
  'informal',
  'semi-formal to informal',
  'semi-formal',
  'formal to semi-formal',
  'formal',
  'formal, semi-formal or informal, depending on the context',
];

export default function GenreTemplateEditor({ template, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: template?.id || null,
    genre: template?.genre || '',
    purpose: template?.purpose || [''],
    intended_reader: template?.intended_reader || '',
    formality: template?.formality || 'informal',
    tone: template?.tone || '',
    structure: template?.structure || [],
    key_features: template?.key_features || [''],
    language_resources: template?.language_resources || [],
    status: template?.status || 'published',
  });

  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Purpose
  const updatePurpose = (i, v) => s('purpose', form.purpose.map((p, j) => j === i ? v : p));
  const addPurpose = () => s('purpose', [...form.purpose, '']);
  const removePurpose = (i) => s('purpose', form.purpose.filter((_, j) => j !== i));

  // Structure
  const addSection = () => s('structure', [...form.structure, { section: '', description: '', is_narrow: false }]);
  const updateSection = (i, field, v) => s('structure', form.structure.map((sec, j) => j === i ? { ...sec, [field]: v } : sec));
  const removeSection = (i) => s('structure', form.structure.filter((_, j) => j !== i));

  // Key features
  const updateFeature = (i, v) => s('key_features', form.key_features.map((f, j) => j === i ? v : f));
  const addFeature = () => s('key_features', [...form.key_features, '']);
  const removeFeature = (i) => s('key_features', form.key_features.filter((_, j) => j !== i));

  // Language resources
  const addLangCat = () => s('language_resources', [...form.language_resources, { category: '', phrases: [''] }]);
  const updateLangCat = (i, field, v) => s('language_resources', form.language_resources.map((c, j) => j === i ? { ...c, [field]: v } : c));
  const updatePhrase = (ci, pi, v) => s('language_resources', form.language_resources.map((c, j) => j === ci ? { ...c, phrases: c.phrases.map((p, k) => k === pi ? v : p) } : c));
  const addPhrase = (ci) => s('language_resources', form.language_resources.map((c, j) => j === ci ? { ...c, phrases: [...c.phrases, ''] } : c));
  const removePhrase = (ci, pi) => s('language_resources', form.language_resources.map((c, j) => j === ci ? { ...c, phrases: c.phrases.filter((_, k) => k !== pi) } : c));
  const removeLangCat = (i) => s('language_resources', form.language_resources.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!form.genre.trim()) return alert('Genre name is required.');
    onSave({
      ...form,
      genre: form.genre.trim(),
      purpose: form.purpose.filter(p => p.trim()),
      key_features: form.key_features.filter(f => f.trim()),
      structure: form.structure.filter(sec => sec.section.trim()),
      language_resources: form.language_resources.filter(c => c.category.trim()).map(c => ({ ...c, phrases: c.phrases.filter(p => p.trim()) })),
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-foreground">{form.id ? 'Edit Genre Template' : 'Add Genre Template'}</h2>

        {/* Genre name */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Genre Name *</label>
          <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. Blog Entry" value={form.genre} onChange={e => s('genre', e.target.value)} />
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Level of Formality</label>
            <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.formality} onChange={e => s('formality', e.target.value)}>
              {FORMALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Tone</label>
            <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. descriptive, personal" value={form.tone} onChange={e => s('tone', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Intended Reader</label>
          <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. the general public" value={form.intended_reader} onChange={e => s('intended_reader', e.target.value)} />
        </div>

        {/* Purpose */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-foreground">Purpose of Writing</label>
            <button type="button" onClick={addPurpose} className="text-xs text-primary hover:underline">+ Add</button>
          </div>
          {form.purpose.map((p, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <input className="flex-1 rounded-xl border border-input px-3 py-1.5 text-sm" placeholder="e.g. to share a personal experience" value={p} onChange={e => updatePurpose(i, e.target.value)} />
              {form.purpose.length > 1 && <button onClick={() => removePurpose(i)} className="text-red-400 hover:text-red-600 px-1"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>

        {/* Structure */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-foreground">Paragraph Structure</label>
            <button type="button" onClick={addSection} className="text-xs text-primary hover:underline">+ Add Section</button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Add sections in order (top to bottom). Tick "Narrow" for header elements like Date, Greeting, etc.</p>
          {form.structure.map((sec, i) => (
            <div key={i} className="flex gap-2 mb-2 items-start">
              <div className="flex-1 bg-muted/40 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input className="flex-1 rounded-lg border border-input px-2 py-1.5 text-sm" placeholder="Section name (e.g. Opening paragraph)" value={sec.section} onChange={e => updateSection(i, 'section', e.target.value)} />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={!!sec.is_narrow} onChange={e => updateSection(i, 'is_narrow', e.target.checked)} className="rounded" />
                    Narrow
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={!!sec.is_optional} onChange={e => updateSection(i, 'is_optional', e.target.checked)} className="rounded" />
                    Optional
                  </label>
                </div>
                <input className="w-full rounded-lg border border-input px-2 py-1.5 text-xs" placeholder="Description (optional)" value={sec.description || ''} onChange={e => updateSection(i, 'description', e.target.value)} />
              </div>
              <button onClick={() => removeSection(i)} className="mt-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {form.structure.length === 0 && <p className="text-xs text-muted-foreground italic">No sections added yet.</p>}
        </div>

        {/* Key Features */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-foreground">Key Features / Techniques</label>
            <button type="button" onClick={addFeature} className="text-xs text-primary hover:underline">+ Add</button>
          </div>
          {form.key_features.map((f, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <input className="flex-1 rounded-xl border border-input px-3 py-1.5 text-sm" placeholder="e.g. Use past tenses to describe events" value={f} onChange={e => updateFeature(i, e.target.value)} />
              {form.key_features.length > 1 && <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 px-1"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>

        {/* Language Resources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-foreground">Useful Language Resources</label>
            <button type="button" onClick={addLangCat} className="text-xs text-primary hover:underline">+ Add Category</button>
          </div>
          {form.language_resources.map((cat, ci) => (
            <div key={ci} className="bg-muted/40 rounded-xl border border-border p-3 mb-3 space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 rounded-lg border border-input px-2 py-1.5 text-sm font-semibold" placeholder="Category name (e.g. Giving advice)" value={cat.category} onChange={e => updateLangCat(ci, 'category', e.target.value)} />
                <button onClick={() => removeLangCat(ci)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              {cat.phrases.map((ph, pi) => (
                <div key={pi} className="flex gap-2">
                  <input className="flex-1 rounded-lg border border-input px-2 py-1.5 text-xs" placeholder="e.g. I sincerely hope that …" value={ph} onChange={e => updatePhrase(ci, pi, e.target.value)} />
                  {cat.phrases.length > 1 && <button onClick={() => removePhrase(ci, pi)} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => addPhrase(ci)} className="text-xs text-primary hover:underline">+ Add phrase</button>
            </div>
          ))}
          {form.language_resources.length === 0 && <p className="text-xs text-muted-foreground italic">No language categories yet.</p>}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
          <span className="text-sm font-medium text-foreground">Status:</span>
          <button onClick={() => s('status', 'draft')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'draft' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>🔒 Draft</button>
          <button onClick={() => s('status', 'published')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${form.status === 'published' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>✅ Published</button>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 select-none">Save Template</button>
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-border border border-border select-none">Cancel</button>
        </div>
      </div>
    </div>
  );
}