import { useRef } from 'react';

/**
 * A plain textarea enhanced with a Bold/Italic toolbar.
 * When showAnswerPreview=true, shows a side-by-side panel with extracted answers.
 */
export default function RichTextArea({ value, onChange, placeholder, className, minHeight = 'min-h-48', showAnswerPreview = false }) {
  const ref = useRef(null);

  const wrap = (before, after) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newText = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

  // Extract answers from [word|explanation] or [word] brackets
  const answers = showAnswerPreview ? (() => {
    const regex = /\[([^\]\|\/]+)(?:\/[^\]\|]*)*(?:\|([^\]]*))?\]/g;
    const results = [];
    let m;
    while ((m = regex.exec(value)) !== null) {
      results.push({ word: m[1].trim(), explanation: (m[2] || '').trim() });
    }
    return results;
  })() : [];

  // Passage preview: replace [word|...] with underlined blank
  const passagePreview = showAnswerPreview
    ? value.replace(/\[([^\]\|\/]+)(?:\/[^\]\|]*)*(?:\|[^\]]*)?\]/g, '______')
    : null;

  return (
    <div className="mb-3">
      {/* Toolbar */}
      <div className="flex gap-1 mb-1 bg-muted/60 border border-input rounded-t-xl px-2 py-1 border-b-0">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); wrap('**', '**'); }}
          title="Bold (select text first)"
          className="px-2.5 py-1 rounded text-sm font-bold text-foreground hover:bg-border transition-colors select-none"
        >B</button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); wrap('_', '_'); }}
          title="Italic (select text first)"
          className="px-2.5 py-1 rounded text-sm italic font-semibold text-foreground hover:bg-border transition-colors select-none"
        >I</button>
        <span className="text-xs text-muted-foreground self-center ml-1">Select text then click B or I</span>
      </div>

      {showAnswerPreview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-input rounded-b-xl overflow-hidden">
          {/* Left: editable passage */}
          <div className="border-r border-input">
            <div className="text-[10px] font-semibold text-muted-foreground bg-muted/40 px-3 py-1 border-b border-input">✏️ Passage (with bracket markup)</div>
            <textarea
              ref={ref}
              className={`w-full bg-background px-3 py-2 text-sm resize-y font-inherit ${minHeight} ${className || ''} border-0 outline-none focus:ring-0`}
              placeholder={placeholder}
              value={value}
              onChange={e => onChange(e.target.value)}
            />
          </div>
          {/* Right: answer preview */}
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold text-muted-foreground bg-muted/40 px-3 py-1 border-b border-input">✅ Answer Key Preview</div>
            <div className={`overflow-y-auto px-3 py-2 bg-muted/20 ${minHeight}`}>
              {answers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-1">No answers detected yet. Mark answers with [word] or [word|explanation].</p>
              ) : (
                <ol className="space-y-1.5">
                  {answers.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <div>
                        <span className="font-semibold text-foreground">{a.word}</span>
                        {a.explanation && <span className="ml-1.5 text-xs text-muted-foreground">{a.explanation}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      ) : (
        <textarea
          ref={ref}
          className={`w-full rounded-b-xl rounded-t-none border border-input bg-background px-3 py-2 text-sm resize-y font-inherit ${minHeight} ${className || ''}`}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}