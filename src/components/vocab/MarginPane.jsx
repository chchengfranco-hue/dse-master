import { cn } from '@/lib/utils';

function getPosClass(meaning) {
  const m = (meaning || '').trim().toLowerCase();
  if (/^\(?(n\.|noun\b)/.test(m)) return 'border-blue-400 bg-blue-50';
  if (/^\(?(v\.|verb\b)/.test(m)) return 'border-red-400 bg-red-50';
  if (/^\(?(adj\.|adjective\b)/.test(m)) return 'border-emerald-400 bg-emerald-50';
  if (/^\(?(adv\.|adverb\b)/.test(m)) return 'border-amber-400 bg-amber-50';
  return 'border-border bg-muted/40';
}

export default function MarginPane({ annotations, activeWord, onHover }) {
  const entries = Object.entries(annotations);
  return (
    <aside className="w-40 shrink-0 flex flex-col gap-2.5 pt-1">
      {entries.map(([word, meaning]) => (
        <div
          key={word}
          onMouseEnter={() => onHover(word)}
          onMouseLeave={() => onHover(null)}
          className={cn(
            "border-l-4 rounded-lg px-3 py-2 text-[11px] leading-snug cursor-pointer transition-all duration-150",
            getPosClass(meaning),
            activeWord === word ? 'shadow-md -translate-x-0.5' : ''
          )}
        >
          <strong className="block text-[12px] text-primary mb-0.5">{word}</strong>
          {meaning}
        </div>
      ))}
    </aside>
  );
}