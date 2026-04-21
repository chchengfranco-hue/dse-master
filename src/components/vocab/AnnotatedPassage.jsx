import { cn } from '@/lib/utils';

export default function AnnotatedPassage({ content, annotations, showRuby, activeWord, onWordClick }) {
  if (!annotations || Object.keys(annotations).length === 0) {
    return <p className="whitespace-pre-wrap text-foreground">{content}</p>;
  }

  // Build a regex that matches any annotated word (case-insensitive, whole word)
  const words = Object.keys(annotations);
  const escaped = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

  const parts = [];
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: content.slice(last, match.index) });
    }
    // Find canonical casing from annotations object
    const canonical = words.find(w => w.toLowerCase() === match[1].toLowerCase()) || match[1];
    parts.push({ type: 'word', value: match[1], canonical });
    last = match.index + match[1].length;
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });

  return (
    <span className="whitespace-pre-wrap text-foreground leading-loose">
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.value}</span>;
        const meaning = annotations[part.canonical];
        const isActive = activeWord === part.canonical;

        if (showRuby) {
          return (
            <ruby
              key={i}
              onClick={() => onWordClick(part.canonical, meaning)}
              className="cursor-pointer font-semibold text-foreground"
              style={{ rubyAlign: 'center' }}
            >
              {part.value}
              <rt style={{ fontSize: '10px', fontWeight: '600', color: '#b45309', lineHeight: '1' }}>{meaning}</rt>
            </ruby>
          );
        }

        return (
          <span
            key={i}
            onClick={() => onWordClick(part.canonical, meaning)}
            className={cn(
              "cursor-pointer rounded px-0.5 border-b border-dashed transition-all duration-150",
              isActive
                ? "bg-yellow-200 text-yellow-900 border-transparent font-semibold"
                : "bg-sky-100 text-sky-800 border-sky-300 hover:bg-yellow-100 hover:text-yellow-900"
            )}
          >
            {part.value}
          </span>
        );
      })}
    </span>
  );
}