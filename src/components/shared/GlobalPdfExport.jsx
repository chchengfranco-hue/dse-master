import { useState, useEffect } from 'react';
import { FileDown, X, CheckSquare, Square, ChevronRight, BookOpen, PenTool, Grid3X3, Book } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODULES = [
  { key: 'reading',  label: 'Reading Passages',    icon: BookOpen,  entity: 'ReadingPassage',  getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => i.content, getAnnotations: i => i.annotations || {} },
  { key: 'writing',  label: 'Writing Models',       icon: PenTool,   entity: 'WritingModel',    getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.question ? `【Question】\n${i.question}\n\n【Model Answer】\n${i.content}` : i.content), getAnnotations: i => i.annotations || {} },
  { key: 'cloze',    label: 'Cloze Exercises',      icon: Grid3X3,   entity: 'ClozeExercise',   getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.content || '').replace(/\[([^\]|/]+)(?:[/][^\]|]*)?(?:\|[^\]]+)?\]/g, '___'), getAnnotations: i => i.annotations || {} },
  { key: 'vocab',    label: 'Essential Vocabulary', icon: Book,      entity: 'VocabSet',        getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.passage ? `Context:\n${i.passage}\n\n` : '') + (i.vocab_data || []).map(v => `${v.word} (${v.pos || ''}) — ${v.meaning}${v.example ? '. E.g. ' + v.example : ''}`).join('\n'), getAnnotations: i => ({}) },
];

function buildPrintHtml(selectedItems, mod, annotLayout = 'below') {
  const itemsHtml = selectedItems.map((item, idx) => {
    const title = (mod.getTitle(item) || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const meta = (mod.getMeta(item) || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = (mod.getBody(item) || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    const annotations = mod.getAnnotations(item);
    const annotEntries = Object.entries(annotations);

    const annotListHtml = annotEntries.length > 0 ? annotEntries.map(([word, meaning]) => `
      <div class="annot-item">
        <span class="annot-word">${word.replace(/</g,'&lt;')}</span>
        <span class="annot-meaning">${(meaning || '').replace(/</g,'&lt;')}</span>
      </div>
    `).join('') : '';

    const annotBelowHtml = annotEntries.length > 0 ? `
      <div class="annot-box">
        <div class="annot-title">📚 Vocabulary &amp; Annotations</div>
        <div class="annot-grid">${annotListHtml}</div>
      </div>
    ` : '';

    const annotSideHtml = annotEntries.length > 0 ? `
      <div class="annot-side">
        <div class="annot-title">📚 Vocab</div>
        ${annotEntries.map(([word, meaning]) => `
          <div class="annot-side-item">
            <span class="annot-word">${word.replace(/</g,'&lt;')}</span>
            <span class="annot-meaning">${(meaning || '').replace(/</g,'&lt;')}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    const contentHtml = annotLayout === 'right' && annotEntries.length > 0
      ? `<div class="two-col"><div class="item-body">${body}</div>${annotSideHtml}</div>`
      : `<div class="item-body">${body}</div>${annotBelowHtml}`;

    return `
      <div class="item ${idx > 0 ? 'page-break' : ''}">
        <div class="item-header">
          <div class="item-num">${idx + 1}</div>
          <div>
            <div class="item-title">${title}</div>
            ${meta ? `<div class="item-meta">${meta}</div>` : ''}
          </div>
        </div>
        ${contentHtml}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${mod.label} — Export</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', 'Heiti TC', system-ui, sans-serif;
    font-size: 12pt;
    color: #222;
    background: #fff;
    padding: 0;
  }
  /* Cover */
  .cover {
    background: #581cb4;
    color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 50px;
    page-break-after: always;
  }
  .cover-label { font-size: 10pt; color: #c4b5fd; letter-spacing: 0.1em; margin-bottom: 16px; }
  .cover-title { font-size: 28pt; font-weight: 700; line-height: 1.2; margin-bottom: 20px; }
  .cover-divider { width: 60px; height: 3px; background: #a78bfa; margin-bottom: 20px; }
  .cover-meta { font-size: 10pt; color: #c4b5fd; line-height: 1.8; }
  /* Items */
  .item { padding: 28px 36px; }
  .page-break { page-break-before: always; }
  .item-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    border-left: 4px solid #7c3aed;
    padding-left: 14px;
    margin-bottom: 16px;
    padding-top: 4px;
    padding-bottom: 4px;
  }
  .item-num {
    background: #7c3aed;
    color: #fff;
    font-size: 9pt;
    font-weight: 700;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .item-title { font-size: 15pt; font-weight: 700; color: #1a1a1a; line-height: 1.4; }
  .item-meta { font-size: 9pt; color: #7c3aed; margin-top: 3px; }
  .item-body {
    font-size: 11pt;
    line-height: 2;
    color: #333;
    white-space: pre-wrap;
  }
  .annot-box {
    margin-top: 20px;
    background: #fefce8;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .annot-title {
    font-size: 9pt;
    font-weight: 700;
    color: #92400e;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .annot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 20px;
  }
  .annot-item { display: flex; gap: 6px; align-items: baseline; }
  .annot-word { font-weight: 700; color: #5b21b6; font-size: 10pt; white-space: nowrap; }
  .annot-meaning { font-size: 10pt; color: #444; }
  /* Side column layout */
  .two-col { display: flex; gap: 16px; align-items: flex-start; }
  .two-col .item-body { flex: 1; min-width: 0; }
  .annot-side {
    width: 160px;
    flex-shrink: 0;
    background: #f5f3ff;
    border-left: 3px solid #7c3aed;
    border-radius: 6px;
    padding: 10px 10px;
  }
  .annot-side .annot-title { font-size: 8pt; font-weight: 700; color: #5b21b6; margin-bottom: 8px; letter-spacing: 0.05em; }
  .annot-side-item { margin-bottom: 7px; }
  .annot-side-item .annot-word { display: block; font-size: 9.5pt; }
  .annot-side-item .annot-meaning { display: block; font-size: 9pt; color: #555; }
  @media print {
    body { padding: 0; }
    .cover { min-height: 100vh; }
  }
</style>
</head>
<body>
  <div class="cover">
    <div class="cover-label">HKDSE LEARNING HUB</div>
    <div class="cover-title">${mod.label}</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}<br/>
      Generated: ${new Date().toLocaleDateString('en-HK', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>
  ${itemsHtml}
</body>
</html>`;
}

export default function GlobalPdfExport({ onClose }) {
  const [activeModule, setActiveModule] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterSubtopic, setFilterSubtopic] = useState('');
  const [annotLayout, setAnnotLayout] = useState('below'); // 'below' | 'right'

  useEffect(() => {
    if (!activeModule) return;
    setLoadingItems(true);
    setSelected(new Set());
    setFilterTopic('');
    setFilterSubtopic('');
    const mod = MODULES.find(m => m.key === activeModule);
    base44.entities[mod.entity].list('-created_date', 300).then(data => {
      const filtered = data.filter(i => i.status === 'published' || (i.status == null && i.is_published !== false));
      setItems(filtered);
      setLoadingItems(false);
    });
  }, [activeModule]);

  const topicTree = {};
  items.forEach(i => {
    const t = i.topic || 'Uncategorized';
    const st = i.subtopic && i.subtopic !== 'General' ? i.subtopic : null;
    if (!topicTree[t]) topicTree[t] = new Set();
    if (st) topicTree[t].add(st);
  });
  const topics = Object.keys(topicTree).sort();

  const visibleItems = items.filter(i => {
    if (filterTopic && (i.topic || 'Uncategorized') !== filterTopic) return false;
    if (filterSubtopic && (i.subtopic && i.subtopic !== 'General' ? i.subtopic : '') !== filterSubtopic) return false;
    return true;
  });

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const visibleIds = visibleItems.map(i => i.id);
    const allVisible = visibleIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allVisible) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every(i => selected.has(i.id));

  const exportPdf = async () => {
    if (selected.size === 0) return alert('Please select at least one item.');
    setGenerating(true);
    const mod = MODULES.find(m => m.key === activeModule);
    const selectedItems = items.filter(i => selected.has(i.id));

    const html = buildPrintHtml(selectedItems, mod, annotLayout);
    const printWin = window.open('', '_blank', 'width=900,height=700');
    printWin.document.write(html);
    printWin.document.close();

    // Wait for fonts/images to load, then print
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        setGenerating(false);
      }, 800);
    };
    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (generating) {
        printWin.focus();
        printWin.print();
        setGenerating(false);
      }
    }, 2000);
  };

  const mod = MODULES.find(m => m.key === activeModule);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center gap-3">
            {activeModule && (
              <button onClick={() => setActiveModule(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileDown className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {activeModule ? mod.label : 'Export to PDF'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeModule ? `${selected.size} selected` : 'Choose a module to export'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Module picker */}
        {!activeModule && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-3">Select a content type to export as a formatted PDF workbook.</p>
            {MODULES.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => setActiveModule(m.key)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all group">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground flex-1">{m.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {/* Item picker */}
        {activeModule && (
          <>
            {/* Topic filter chips */}
            {!loadingItems && topics.length > 0 && (
              <div className="px-5 pt-3 pb-2 border-b border-border shrink-0 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => { setFilterTopic(''); setFilterSubtopic(''); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterTopic ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-border'}`}>All</button>
                  {topics.map(t => (
                    <button key={t} onClick={() => { setFilterTopic(t); setFilterSubtopic(''); }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterTopic === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-border'}`}>{t}</button>
                  ))}
                </div>
                {filterTopic && topicTree[filterTopic] && Array.from(topicTree[filterTopic]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterSubtopic('')}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterSubtopic ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>All {filterTopic}</button>
                    {Array.from(topicTree[filterTopic]).sort().map(st => (
                      <button key={st} onClick={() => setFilterSubtopic(st)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterSubtopic === st ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>{st}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Select all bar */}
            <div className="px-5 py-2.5 border-b border-border shrink-0 flex items-center justify-between bg-muted/30">
              <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-foreground font-medium hover:text-primary transition-colors">
                {allVisibleSelected
                  ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-xs text-muted-foreground">{selected.size} / {items.length} selected</span>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {loadingItems
                ? <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
                : visibleItems.length === 0
                  ? <p className="text-center py-10 text-muted-foreground text-sm">No published items found.</p>
                  : visibleItems.map(item => (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${selected.has(item.id) ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-muted/60'}`}>
                      {selected.has(item.id)
                        ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                        : <Square className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{mod.getTitle(item)}</p>
                        <p className="text-xs text-muted-foreground truncate">{mod.getMeta(item)}</p>
                      </div>
                    </button>
                  ))
              }
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0 bg-card space-y-3">
              {/* Annotation layout toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium shrink-0">Annotations:</span>
                <button onClick={() => setAnnotLayout('below')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${annotLayout === 'below' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-border'}`}>
                  Below passage
                </button>
                <button onClick={() => setAnnotLayout('right')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${annotLayout === 'right' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-border'}`}>
                  Right column
                </button>
              </div>
              <div className="flex gap-2 justify-end">
              <button onClick={() => setActiveModule(null)} className="px-4 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-medium hover:bg-border transition-colors">Back</button>
              <button onClick={exportPdf} disabled={generating || selected.size === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {generating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FileDown className="w-4 h-4" />}
                {generating ? 'Generating…' : `Export${selected.size > 0 ? ` (${selected.size})` : ''} PDF`}
              </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}