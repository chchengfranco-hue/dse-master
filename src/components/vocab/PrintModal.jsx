import { Button } from '@/components/ui/button';

export default function PrintModal({ passage, isEditor, onClose }) {
  const annotations = passage.annotations || {};

  const executePrint = (mode) => {
    onClose();
    const style = document.createElement('style');
    style.id = 'print-override';

    if (mode === 'clean') {
      style.textContent = `
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; }
          .annotated-span { background: none !important; border: none !important; color: inherit !important; }
          ruby rt { display: none !important; }
        }
      `;
    } else if (mode === 'vocab') {
      style.textContent = `@media print { body > *:not(#print-root) { display: none !important; } #print-root { display: block !important; } }`;
    }

    document.head.appendChild(style);

    // Build print content
    const el = document.createElement('div');
    el.id = 'print-root';
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999;background:white;padding:2cm;display:none;';

    if (mode === 'vocab') {
      el.innerHTML = `<h1 style="font-size:18pt;margin-bottom:12pt;">${passage.title} — Vocabulary List</h1>
        <ul style="columns:2;column-gap:40px;font-size:11pt;line-height:1.8;">
          ${Object.entries(annotations).sort().map(([w, m]) => `<li><strong>${w}</strong>: ${m}</li>`).join('')}
        </ul>`;
    } else if (mode === 'margin') {
      const posStyle = (m) => {
        const t = m.toLowerCase();
        if (/^n\./.test(t)) return 'border-left:4px solid #93c5fd;background:#eff6ff;';
        if (/^v\./.test(t)) return 'border-left:4px solid #fca5a5;background:#fef2f2;';
        if (/^adj\./.test(t)) return 'border-left:4px solid #6ee7b7;background:#ecfdf5;';
        if (/^adv\./.test(t)) return 'border-left:4px solid #fcd34d;background:#fffbeb;';
        return 'border-left:4px solid #d1d5db;background:#f9fafb;';
      };
      const notesHtml = Object.entries(annotations).map(([w, m]) =>
        `<div style="margin-bottom:8px;padding:6px 8px;border-radius:5px;font-size:9pt;line-height:1.3;${posStyle(m)}"><strong style="display:block;font-size:10pt;color:#0284c7;">${w}</strong>${m}</div>`
      ).join('');
      el.innerHTML = `
        <h1 style="font-size:18pt;margin-bottom:12pt;">${passage.title}</h1>
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="width:70%;vertical-align:top;padding-right:20px;font-size:12pt;line-height:2.2;font-family:Georgia,serif;">${passage.content.replace(/\n/g, '<br>')}</td>
          <td style="width:30%;vertical-align:top;">${notesHtml}</td>
        </tr></table>`;
    } else {
      el.innerHTML = `<h1 style="font-size:18pt;margin-bottom:6pt;">Name: _______________________ Date: __________</h1>
        <h2 style="font-size:16pt;margin-bottom:12pt;">${passage.title}</h2>
        <div style="font-size:12pt;line-height:2.2;font-family:Georgia,serif;">${passage.content.replace(/\n/g, '<br>')}</div>`;
    }

    document.body.appendChild(el);
    el.style.display = 'block';

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        el.remove();
        document.getElementById('print-override')?.remove();
      }, 500);
    }, 100);
  };

  const copyToClipboard = () => {
    const text = `${passage.title}\n\n${passage.content}\n\nVocabulary:\n${Object.entries(annotations).map(([w, m]) => `${w}: ${m}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => alert('✅ Copied to clipboard!'));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">🖨️ Print & Export</h3>

        {isEditor && (
          <>
            <button onClick={copyToClipboard} className="w-full text-left mb-2 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-semibold text-sm hover:bg-sky-100 transition-colors">
              📋 Copy passage + vocab to clipboard
            </button>
          </>
        )}

        <button onClick={() => executePrint('clean')} className="w-full text-left mb-2 px-4 py-3 rounded-xl bg-secondary border border-border font-semibold text-sm hover:bg-muted transition-colors">
          1. Print: Clean Passage
        </button>
        <button onClick={() => executePrint('margin')} className="w-full text-left mb-2 px-4 py-3 rounded-xl bg-secondary border border-border font-semibold text-sm hover:bg-muted transition-colors">
          2. Print: Passage + Margin Notes
        </button>
        <button onClick={() => executePrint('vocab')} className="w-full text-left mb-3 px-4 py-3 rounded-xl bg-secondary border border-border font-semibold text-sm hover:bg-muted transition-colors">
          3. Print: Vocabulary List Only
        </button>

        <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}