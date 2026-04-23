import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FileDown, X, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODULES = [
  { key: 'reading',  label: 'Reading Passages',    entity: 'ReadingPassage',  getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => i.content },
  { key: 'writing',  label: 'Writing Models',       entity: 'WritingModel',    getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.question ? `Question:\n${i.question}\n\nModel Answer:\n${i.content}` : i.content) },
  { key: 'cloze',    label: 'Cloze Exercises',      entity: 'ClozeExercise',   getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.content || '').replace(/\[([^\]|/]+)(?:[/][^\]|]*)?(?:\|[^\]]+)?\]/g, '___') },
  { key: 'vocab',    label: 'Essential Vocabulary', entity: 'VocabSet',        getTitle: i => i.title, getMeta: i => [i.topic, i.subtopic && i.subtopic !== 'General' ? i.subtopic : ''].filter(Boolean).join(' › '), getBody: i => (i.passage ? `Context:\n${i.passage}\n\n` : '') + (i.vocab_data || []).map(v => `${v.word} (${v.pos}) — ${v.meaning}${v.example ? '. E.g. ' + v.example : ''}`).join('\n') },
];

export default function GlobalPdfExport({ onClose }) {
  const [activeModule, setActiveModule] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!activeModule) return;
    setLoadingItems(true);
    setSelected(new Set());
    const mod = MODULES.find(m => m.key === activeModule);
    base44.entities[mod.entity].list('-created_date', 300).then(data => {
      const filtered = data.filter(i => i.status === 'published' || (i.status == null && i.is_published !== false));
      setItems(filtered);
      setLoadingItems(false);
    });
  }, [activeModule]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const exportPdf = async () => {
    if (selected.size === 0) return alert('Please select at least one item.');
    setGenerating(true);
    const mod = MODULES.find(m => m.key === activeModule);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 190;
    const MARGIN = 10;
    let y = MARGIN;
    const selectedItems = items.filter(i => selected.has(i.id));

    const addText = (text, fontSize, bold, color, maxW, lineH) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text || '', maxW);
      lines.forEach(line => {
        if (y + lineH > 280) { doc.addPage(); y = MARGIN; }
        doc.text(line, MARGIN, y);
        y += lineH;
      });
    };

    // Cover
    doc.setFillColor(99, 51, 200);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('HKDSE Learning Hub', MARGIN, 18);
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text(`${mod.label} — Export`, MARGIN, 28);
    doc.setFontSize(9); doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-HK', { year: 'numeric', month: 'long', day: 'numeric' })}  •  ${selectedItems.length} item(s)`, MARGIN, 36);
    y = 52;
    doc.setTextColor(40, 40, 40);

    selectedItems.forEach((item, idx) => {
      if (idx > 0) {
        if (y + 10 > 280) { doc.addPage(); y = MARGIN; }
        doc.setDrawColor(200, 200, 200);
        doc.line(MARGIN, y, MARGIN + W, y);
        y += 6;
      }
      addText(mod.getTitle(item), 14, true, [40, 40, 40], W, 7);
      y += 1;
      const meta = mod.getMeta(item);
      if (meta) addText(meta, 9, false, [120, 80, 200], W, 5);
      y += 2;
      const rawBody = (mod.getBody(item) || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/_(.*?)_/g, '$1');
      addText(rawBody, 10, false, [40, 40, 40], W, 5.5);
      y += 6;
    });

    doc.save(`${mod.label.replace(/\s+/g, '_')}_export.pdf`);
    setGenerating(false);
  };

  const mod = MODULES.find(m => m.key === activeModule);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {activeModule && (
              <button onClick={() => setActiveModule(null)} className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileDown className="w-5 h-5 text-primary" />
                {activeModule ? mod.label : 'Export to PDF'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeModule ? 'Select items to include' : 'Choose a module to export'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Module picker */}
        {!activeModule && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {MODULES.map(m => (
              <button key={m.key} onClick={() => setActiveModule(m.key)}
                className="w-full text-left flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-background hover:bg-muted transition-colors">
                <span className="font-semibold text-foreground">{m.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Item picker */}
        {activeModule && (
          <>
            {/* Select all */}
            <div className="px-5 py-2 border-b border-border shrink-0 flex items-center justify-between">
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-foreground font-medium hover:text-primary transition-colors">
                {selected.size === items.length && items.length > 0
                  ? <CheckSquare className="w-4 h-4 text-primary" />
                  : <Square className="w-4 h-4 text-muted-foreground" />}
                {selected.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs text-muted-foreground">{selected.size} / {items.length} selected</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
              {loadingItems
                ? <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
                : items.length === 0
                  ? <p className="text-center py-10 text-muted-foreground text-sm">No published items found.</p>
                  : items.map(item => (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${selected.has(item.id) ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-muted'}`}>
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

            <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2 justify-end">
              <button onClick={() => setActiveModule(null)} className="px-4 py-2 bg-muted border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-border transition-colors">Back</button>
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