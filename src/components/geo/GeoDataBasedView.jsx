import { useState } from 'react';

export default function GeoDataBasedView({ questions }) {
  const [showAnswers, setShowAnswers] = useState({});
  const [showZh, setShowZh] = useState(false);

  const toggleAnswer = (qi, si) => {
    const key = `${qi}-${si}`;
    setShowAnswers(s => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-sm font-semibold text-foreground">{questions.length} Data-based Questions</span>
        <button onClick={() => setShowZh(v => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showZh ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-muted text-muted-foreground border-border'}`}>
          {showZh ? '🇬🇧 EN Only' : '🇭🇰 顯示中文'}
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start gap-2 mb-4">
              <span className="shrink-0 px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">Q{qi + 1}</span>
              <div className="flex-1">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-1">
                  <p className="font-semibold text-emerald-800 mb-1">📊 Data / 資料</p>
                  <p className="text-foreground">{q.context_en}</p>
                  {showZh && <p className="text-muted-foreground mt-2">{q.context_zh}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(q.sub_questions || []).map((sq, si) => {
                const key = `${qi}-${si}`;
                return (
                  <div key={si} className="bg-muted/40 rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded">({sq.label})</span>
                          <span className="text-xs text-muted-foreground">[{sq.marks} mark{sq.marks !== 1 ? 's' : ''}]</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{sq.question_en}</p>
                        {showZh && <p className="text-sm text-muted-foreground mt-1">{sq.question_zh}</p>}
                      </div>
                      <button
                        onClick={() => toggleAnswer(qi, si)}
                        className="shrink-0 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                      >
                        {showAnswers[key] ? '🙈 Hide' : '👁 Answer'}
                      </button>
                    </div>
                    {showAnswers[key] && (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="text-xs font-bold text-green-700 mb-1">✅ Model Answer:</p>
                        <p className="text-sm text-foreground">{sq.answer_en}</p>
                        {showZh && <p className="text-sm text-muted-foreground mt-2">{sq.answer_zh}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}