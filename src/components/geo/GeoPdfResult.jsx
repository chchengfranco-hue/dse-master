import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RotateCcw, Printer, Copy, Check } from 'lucide-react';

export default function GeoPdfResult({ markdown, onReset }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Extracted Exercise 試題提取結果</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Bilingual · Structured · Answer Key included</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-border transition-colors"
          >
            {copied ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Markdown</>}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-border transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* Rendered Markdown */}
      <div className="bg-card rounded-2xl border border-border p-6 prose prose-sm max-w-none
        prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground
        prose-table:text-foreground prose-th:bg-primary/10 prose-th:text-primary prose-th:font-semibold
        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
        prose-tr:border-b prose-tr:border-border
        prose-code:bg-muted prose-code:px-1 prose-code:rounded
        prose-hr:border-border">
        <ReactMarkdown
          components={{
            details: ({ children }) => (
              <details className="mt-2 mb-4 border border-border rounded-xl overflow-hidden">
                {children}
              </details>
            ),
            summary: ({ children }) => (
              <summary className="cursor-pointer px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-sm font-semibold text-primary select-none transition-colors">
                {children}
              </summary>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>

      {/* Raw Markdown toggle */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground px-1 py-2 select-none">
          View raw Markdown 查看原始 Markdown
        </summary>
        <pre className="mt-2 bg-muted rounded-xl p-4 text-xs overflow-auto whitespace-pre-wrap border border-border text-foreground">
          {markdown}
        </pre>
      </details>
    </div>
  );
}