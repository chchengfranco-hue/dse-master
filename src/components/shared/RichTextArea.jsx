import { useRef } from 'react';

/**
 * A plain textarea enhanced with a Bold/Italic toolbar.
 * Wraps selected text with **bold** or _italic_ markdown-style markers.
 * Renders as a normal <textarea> so existing save logic is unchanged.
 */
export default function RichTextArea({ value, onChange, placeholder, className, minHeight = 'min-h-48' }) {
  const ref = useRef(null);

  const wrap = (before, after) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const newText = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newText);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

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
      <textarea
        ref={ref}
        className={`w-full rounded-b-xl rounded-t-none border border-input bg-background px-3 py-2 text-sm resize-y font-inherit ${minHeight} ${className || ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}