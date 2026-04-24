import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FileDown, X, CheckSquare, Square, ChevronRight, BookOpen, PenTool, Grid3X3, Book } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODULES = [
  { key: 'reading',  label: 'Reading Passages',    icon: BookOpen,  entity: 'ReadingPassage',  getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => i.content, getAnnotations: i => i.annotations || {} },
  { key: 'writing',  label: 'Writing Models',       icon: PenTool,   entity: 'WritingModel',    getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.question ? `Question:\n${i.question}\n\nModel Answer:\n${i.content}` : i.content), getAnnotations: i => i.annotations || {} },
  { key: 'cloze',    label: 'Cloze Exercises',      icon: Grid3X3,   entity: 'ClozeExercise',   getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.content || '').replace(/\[([^\]|/]+)(?:[/][^\]|]*)?(?:\|[^\]]+)?\]/g, '___'), getAnnotations: i => i.annotations || {} },
  { key: 'vocab',    label: 'Essential Vocabulary', icon: Book,      entity: 'VocabSet',        getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.passage ? `Context:\n${i.passage}\n\n` : '') + (i.vocab_data || []).map(v => `${v.word} (${v.pos}) — ${v.meaning}${v.example ? '. E.g. ' + v.example : ''}`).join('\n'), getAnnotations: i => ({}) },
];

export default function GlobalPdfExport({ onClose }) {
  const [activeModule, setActiveModule] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterSubtopic, setFilterSubtopic] = useState('');

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
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210; // page width
    const PH = 297; // page height
    const ML = 15;  // margin left
    const MR = 15;  // margin right
    const MT = 15;  // margin top
    const MB = 15;  // margin bottom
    const W = PW - ML - MR; // usable width
    let y = MT;

    const checkPage = (needed = 8) => {
      if (y + needed > PH - MB) { doc.addPage(); y = MT; }
    };

    const addText = (text, fontSize, style, color, maxW, lineH, x = ML) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style || 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text || '', maxW);
      lines.forEach(line => {
        checkPage(lineH);
        doc.text(line, x, y);
        y += lineH;
      });
    };

    const selectedItems = items.filter(i => selected.has(i.id));

    // ── Cover page ──────────────────────────────────────────────
    // Purple gradient background
    doc.setFillColor(88, 28, 180);
    doc.rect(0, 0, PW, PH, 'F');
    // Decorative accent bar
    doc.setFillColor(124, 58, 237);
    doc.rect(0, PH - 60, PW, 60, 'F');

    // App name
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(196, 181, 253);
    doc.text('HKDSE LEARNING HUB', ML, 40);

    // Module label
    doc.setFontSize(32); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    const titleLines = doc.splitTextToSize(mod.label, W);
    titleLines.forEach((line, i) => { doc.text(line, ML, 58 + i * 14); });

    // Divider
    doc.setDrawColor(167, 139, 250);
    doc.setLineWidth(0.5);
    doc.line(ML, 82, ML + 40, 82);

    // Meta
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(196, 181, 253);
    doc.text(`${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} selected`, ML, 90);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-HK', { year: 'numeric', month: 'long', day: 'numeric' })}`, ML, 98);

    // Bottom tagline
    doc.setFontSize(9); doc.setTextColor(167, 139, 250);
    doc.text('Ace HKDSE English Learning Platform', ML, PH - 20);

    doc.addPage();
    y = MT;
    doc.setTextColor(40, 40, 40);

    // ── Table of contents ────────────────────────────────────────
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
    doc.text('Contents', ML, y); y += 8;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(ML, y, ML + W, y); y += 5;

    selectedItems.forEach((item, idx) => {
      checkPage(6);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(`${idx + 1}.`, ML, y);
      const titleLine = doc.splitTextToSize(mod.getTitle(item), W - 15)[0];
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
      doc.text(titleLine, ML + 8, y);
      y += 5.5;
    });
    y += 4;

    // ── Items ────────────────────────────────────────────────────
    selectedItems.forEach((item, idx) => {
      checkPage(20);

      // Section separator / header block
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(ML - 3, y - 4, W + 6, 22, 2, 2, 'F');
      doc.setDrawColor(167, 139, 250); doc.setLineWidth(0.4);
      doc.line(ML - 3, y - 4, ML - 3, y + 18);

      // Item number badge
      doc.setFillColor(109, 40, 217);
      doc.circle(ML + 3.5, y + 5, 3.5, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1), ML + 3.5, y + 6.5, { align: 'center' });

      // Title
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
      const titleLines2 = doc.splitTextToSize(mod.getTitle(item), W - 12);
      titleLines2.forEach((line, li) => { doc.text(line, ML + 10, y + (li === 0 ? 3 : 3 + li * 6)); });
      y += Math.max(titleLines2.length * 6, 8);

      // Meta
      const meta = mod.getMeta(item);
      if (meta) {
        doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(109, 40, 217);
        doc.text(meta, ML + 10, y);
        y += 5;
      }
      y += 4;

      // Body
      const rawBody = (mod.getBody(item) || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/_(.*?)_/g, '$1');
      addText(rawBody, 10, 'normal', [50, 50, 50], W, 5.5);
      y += 3;

      // Annotations
      const annotations = mod.getAnnotations(item);
      const annotEntries = Object.entries(annotations);
      if (annotEntries.length > 0) {
        checkPage(14);
        // Annotation header
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(ML - 3, y - 2, W + 6, 8, 1.5, 1.5, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
        doc.text('Vocabulary & Annotations', ML, y + 3.5);
        y += 9;

        // Two-column annotation list
        const colW = (W - 4) / 2;
        annotEntries.forEach(([word, meaning], ai) => {
          const col = ai % 2;
          const xPos = ML + col * (colW + 4);
          if (col === 0) checkPage(7);
          const label = `${word}:`;
          const desc = meaning;
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(88, 28, 180);
          doc.text(label, xPos, y);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
          const descLines = doc.splitTextToSize(desc, colW - doc.getTextWidth(label) - 2);
          doc.text(descLines[0] || '', xPos + doc.getTextWidth(label) + 1.5, y);
          if (col === 1 || ai === annotEntries.length - 1) y += 6;
        });
        y += 3;
      }

      // Divider between items
      if (idx < selectedItems.length - 1) {
        checkPage(10);
        doc.setDrawColor(220, 215, 240); doc.setLineWidth(0.3);
        doc.line(ML, y, ML + W, y);
        y += 8;
      }
    });

    doc.save(`${mod.label.replace(/\s+/g, '_')}_export.pdf`);
    setGenerating(false);
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
                  <div className="w-8 h-8 bg-primary/8 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
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
            <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2 justify-end bg-card">
              <button onClick={() => setActiveModule(null)} className="px-4 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-medium hover:bg-border transition-colors">Back</button>
              <button onClick={exportPdf} disabled={generating || selected.size === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                {generating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FileDown className="w-4 h-4" />}
                {generating ? 'Generating…' : `Export${selected.size > 0 ? ` (${selected.size})` : ''} PDF`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}