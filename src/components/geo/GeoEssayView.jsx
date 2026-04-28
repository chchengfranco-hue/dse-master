import { useState } from 'react';

export default function GeoEssayView({ questions }) {
  const [showAnswers, setShowAnswers] = useState({});
  const [showZh, setShowZh] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-sm font-semibold text-foreground">{questions.length} Short Essay Questions</span>
        <button onClick={() => setShowZh(v => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showZh ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-muted text-muted-foreground border-border'}`}>
          {showZh ? '🇬🇧 EN Only' : '🇭🇰 顯示中文'}
        </button>
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="shrink-0 px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">Q{qi + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground font-medium">[{q.marks} marks 分]</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{q.question_en}</p>
                {showZh && <p className="text-sm text-muted-foreground mt-2">{q.question_zh}</p>}
              </div>
            </div>

            {q.guidance_en && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
                <p className="text-xs font-bold text-blue-800 mb-1">💡 Guidance 答題指引</p>
                <p className="text-sm text-blue-700">{q.guidance_en}</p>
                {showZh && <p className="text-sm text-blue-600 mt-1">{q.guidance_zh}</p>}
              </div>
            )}

            <button
              onClick={() => setShowAnswers(s => ({ ...s, [qi]: !s[qi] }))}
              className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              {showAnswers[qi] ? '🙈 Hide Model Answer' : '📝 Show Model Answer 參考答案'}
            </button>

            {showAnswers[qi] && (
              <div className="mt-4 border-t border-border pt-4 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-green-800 mb-2">✅ Model Answer (EN):</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{q.model_answer_en}</p>
                </div>
                {showZh && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-800 mb-2">✅ 參考答案 (中文):</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{q.model_answer_zh}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}